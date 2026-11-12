import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/mongoose";
import { Payment } from "@/models/Payment";
import { Organization } from "@/models/Organization";
import { SubscriptionEvent } from "@/models/SubscriptionEvent";
import { writeAudit, auditContextFrom } from "@/lib/audit";
import { PLANS } from "@/lib/subscriptions/plans";
import {
  PaystackNotConfiguredError,
  paystackKeySource,
  verifyTransaction,
  verifyWebhookSignature,
  type PaystackWebhookEvent,
} from "@/lib/payments/paystack";

const DAY_MS = 24 * 60 * 60 * 1000;
const PERIOD_DAYS = 30;

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

/**
 * Paystack webhook.
 *
 * Trust nothing in the body: the signature is verified with the secret key,
 * then the transaction is re-fetched from Paystack before any plan changes.
 * Payment rows are updated atomically so duplicate deliveries (Paystack
 * retries aggressively) cannot extend a subscription twice.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  let signatureValid: boolean;
  try {
    signatureValid = verifyWebhookSignature(raw, signature);
  } catch (e) {
    if (e instanceof PaystackNotConfiguredError) {
      console.error("paystack webhook received but Paystack is not configured");
      return NextResponse.json({ error: "Paystack is not configured" }, { status: 503 });
    }
    throw e;
  }
  if (!signatureValid) {
    // Names only, never values: tells support whether a stale
    // PAYSTACK_SECRET_KEY is shadowing the key the dashboard is signing with.
    console.warn("paystack webhook signature rejected", {
      hasSignature: Boolean(signature),
      keySource: paystackKeySource(),
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: PaystackWebhookEvent;
  try {
    event = JSON.parse(raw) as PaystackWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const reference = event?.data?.reference;
  if (!reference) return NextResponse.json({ ok: true, ignored: "no reference" });

  await dbConnect();
  const payment = await Payment.findOne({ reference });
  // Unknown references are acknowledged without touching anything — returning
  // an error would make Paystack retry them forever.
  if (!payment) return NextResponse.json({ ok: true, ignored: "unknown reference" });
  if (payment.status === "SUCCESS") return NextResponse.json({ ok: true, idempotent: true });

  if (event.event === "charge.failed") {
    await Payment.updateOne(
      { reference, status: { $ne: "SUCCESS" } },
      { $set: { status: "FAILED", metadata: { gatewayStatus: event.data.status } } }
    );
    await SubscriptionEvent.create({
      organizationId: payment.organizationId,
      type: "PAYMENT_FAILED",
      fromPlan: payment.plan,
      toPlan: payment.plan,
      metadata: { reference, gatewayStatus: event.data.status },
    }).catch(() => {});
    return NextResponse.json({ ok: true });
  }

  if (event.event !== "charge.success") return NextResponse.json({ ok: true, ignored: event.event });

  // Server-side verification: the webhook alone never activates a plan.
  let verified;
  try {
    verified = await verifyTransaction(reference);
  } catch (e) {
    console.error("paystack verify failed", e);
    return NextResponse.json({ error: "Verification unavailable" }, { status: 502 });
  }

  const expectedPesewas = payment.amountPesewas;
  const amountOk = typeof verified.amount === "number" && verified.amount >= expectedPesewas;
  const currencyOk = (verified.currency || "GHS").toUpperCase() === "GHS";
  if (verified.status !== "success" || !amountOk || !currencyOk) {
    console.error("paystack webhook verification mismatch", {
      reference,
      status: verified.status,
      amount: verified.amount,
      expectedPesewas,
      currency: verified.currency,
    });
    return NextResponse.json({ ok: true, ignored: "verification mismatch" });
  }

  const now = new Date();
  const paidAt = verified.paid_at && !Number.isNaN(Date.parse(verified.paid_at)) ? new Date(verified.paid_at) : now;

  // Claim the payment atomically. If another delivery won the race, stop here.
  const claimed = await Payment.findOneAndUpdate(
    { reference, status: { $ne: "SUCCESS" } },
    {
      $set: {
        status: "SUCCESS",
        paidAt,
        channel: verified.channel || undefined,
        periodStart: now,
        periodEnd: addDays(now, PERIOD_DAYS),
      },
    },
    { new: true }
  );
  if (!claimed) return NextResponse.json({ ok: true, idempotent: true });

  const org = await Organization.findById(payment.organizationId);
  if (!org) {
    // Payment recorded; nothing to activate. Flag loudly for support.
    console.error("paystack payment for missing organization", String(payment.organizationId));
    return NextResponse.json({ ok: true, ignored: "organization missing" });
  }

  const fromPlan = org.plan;
  const fromStatus = org.subscriptionStatus;
  const periodBase = org.currentPeriodEnd && org.currentPeriodEnd.getTime() > now.getTime() ? org.currentPeriodEnd : now;

  org.plan = payment.plan;
  org.subscriptionStatus = "ACTIVE";
  org.planStartedAt = org.planStartedAt ?? now;
  org.currentPeriodEnd = addDays(periodBase, PERIOD_DAYS);
  await org.save();

  await Payment.updateOne(
    { _id: claimed._id },
    { $set: { periodEnd: org.currentPeriodEnd } }
  ).catch(() => {});

  const events: Array<Record<string, unknown>> = [
    {
      organizationId: org._id,
      type: "PAYMENT_SUCCEEDED",
      fromPlan,
      toPlan: payment.plan,
      fromStatus,
      toStatus: "ACTIVE",
      note: `${PLANS[payment.plan].name} payment confirmed`,
      metadata: { reference, amountGhs: payment.amountGhs, channel: verified.channel || null },
    },
  ];
  if (fromPlan !== payment.plan) {
    events.push({
      organizationId: org._id,
      type: "PLAN_CHANGED",
      fromPlan,
      toPlan: payment.plan,
      note: "Plan changed by verified Paystack payment",
      metadata: { reference },
    });
  }
  await SubscriptionEvent.insertMany(events).catch((e) => console.error("subscription event write failed", e));

  await writeAudit({
    organizationId: String(org._id),
    actorId: null,
    action: "SUBSCRIPTION_PAYMENT_SUCCEEDED",
    targetType: "Organization",
    targetId: String(org._id),
    metadata: { reference, plan: payment.plan, amountGhs: payment.amountGhs, periodEnd: org.currentPeriodEnd },
    ...auditContextFrom(req),
  });

  return NextResponse.json({ ok: true });
}
