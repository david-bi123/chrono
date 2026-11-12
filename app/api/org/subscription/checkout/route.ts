import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import { Organization } from "@/models/Organization";
import { User } from "@/models/User";
import { Payment } from "@/models/Payment";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { PLAN_IDS, PLANS } from "@/lib/subscriptions/plans";
import {
  amountToPesewas,
  appBaseUrl,
  initializeTransaction,
  newReference,
  PaystackNotConfiguredError,
  PaystackRequestError,
} from "@/lib/payments/paystack";

/**
 * Starts a Paystack checkout for a plan purchase or renewal.
 *
 * Nothing is activated here. The Payment row stays PENDING until the webhook
 * (and a server-side verify call) confirms the charge.
 */
export async function POST(req: Request) {
  const s = await getSession();
  if (!s || s.role !== "ORGANIZATION_ADMIN" || !s.orgId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const rl = rateLimit(rateLimitKey(req, `checkout:${s.orgId}`), 10, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many checkout attempts. Try again later." }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const parsed = z.object({ plan: z.enum(PLAN_IDS) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Choose a plan" }, { status: 400 });

  await dbConnect();
  const [org, admin] = await Promise.all([
    Organization.findById(s.orgId).lean(),
    User.findById(s.sub).select("email firstName").lean(),
  ]);
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  if (org.status !== "ACTIVE") {
    return NextResponse.json({ error: "This workspace is suspended. Contact SamTech Labs." }, { status: 403 });
  }

  const plan = PLANS[parsed.data.plan];
  const amountPesewas = amountToPesewas(plan.priceGhs);
  const reference = newReference(String(s.orgId));

  await Payment.create({
    organizationId: s.orgId,
    provider: "PAYSTACK",
    reference,
    plan: plan.id,
    amountGhs: plan.priceGhs,
    amountPesewas,
    currency: "GHS",
    status: "PENDING",
    initiatedBy: s.sub,
    metadata: { organizationName: org.name, planName: plan.name },
  });

  try {
    const initialized = await initializeTransaction({
      email: (admin as { email?: string } | null)?.email || org.email,
      amountPesewas,
      reference,
      callbackUrl: `${appBaseUrl()}/dashboard/subscription?reference=${encodeURIComponent(reference)}`,
      metadata: {
        organizationId: String(s.orgId),
        plan: plan.id,
        purpose: "subscription",
      },
    });

    return NextResponse.json({
      ok: true,
      reference,
      plan: plan.id,
      amountGhs: plan.priceGhs,
      authorizationUrl: initialized.authorization_url,
      accessCode: initialized.access_code,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Payment could not be started";
    await Payment.updateOne(
      { reference },
      { $set: { status: "FAILED", metadata: { error: message } } }
    ).catch(() => {});
    if (e instanceof PaystackNotConfiguredError) {
      return NextResponse.json({ error: "Card payments are not configured yet. Contact SamTech Labs." }, { status: 503 });
    }
    if (e instanceof PaystackRequestError) {
      return NextResponse.json({ error: message }, { status: e.status >= 400 && e.status < 600 ? e.status : 502 });
    }
    console.error("paystack initialize failed", e);
    return NextResponse.json({ error: "Payment could not be started. Try again." }, { status: 500 });
  }
}
