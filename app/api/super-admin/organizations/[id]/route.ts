import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db/mongoose";
import { Organization } from "@/models/Organization";
import { SubscriptionEvent } from "@/models/SubscriptionEvent";
import { getSession } from "@/lib/auth/session";
import { writeAudit, auditContextFrom } from "@/lib/audit";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { PLAN_IDS } from "@/lib/subscriptions/plans";
import { getEntitlements } from "@/lib/subscriptions/entitlements";

const patchSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(40).optional(),
  address: z.string().max(300).optional(),
  industry: z.string().max(100).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
  plan: z.enum(PLAN_IDS).optional(),
  subscriptionStatus: z.enum(["ACTIVE", "PAST_DUE", "SUSPENDED", "CANCELLED"]).optional(),
  billingExempt: z.boolean().optional(),
  currentPeriodEnd: z
    .string()
    .refine((s) => s === "" || !Number.isNaN(Date.parse(s)), "Enter a valid date")
    .optional(),
  extendDays: z.coerce.number().int().min(1).max(730).optional(),
  note: z.string().trim().max(500).optional(),
});

const DAY_MS = 24 * 60 * 60 * 1000;

/** Single organisation with live usage and plan history (super admin only). */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s || s.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await dbConnect();
  const org = await Organization.findById(params.id).lean();
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const entitlements = await getEntitlements(params.id);
  const events = await SubscriptionEvent.find({ organizationId: params.id }).sort({ createdAt: -1 }).limit(25).lean();
  return NextResponse.json({
    organization: { ...(org as unknown as Record<string, unknown>), _id: String(params.id) },
    subscription: entitlements
      ? {
          plan: entitlements.plan,
          status: entitlements.subscriptionStatus,
          usage: entitlements.usage,
          limits: entitlements.limits,
          remaining: entitlements.remaining,
          historyMonths: entitlements.historyMonths,
          oldestHistoryDate: entitlements.oldestHistoryDate,
        }
      : null,
    events: events.map((e) => {
      const r = e as unknown as Record<string, unknown>;
      return { ...r, _id: String(r._id) };
    }),
  });
}

/**
 * Super-admin organisation update. Plan, subscription status and billing
 * period changes are recorded in SubscriptionEvent so the console can show a
 * history and support can explain what happened.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s || s.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rl = rateLimit(rateLimitKey(req, "org-update"), 60, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });

  await dbConnect();
  const org = await Organization.findById(params.id);
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const before = {
    plan: org.plan,
    subscriptionStatus: org.subscriptionStatus,
    currentPeriodEnd: org.currentPeriodEnd ?? null,
  };

  const { extendDays, currentPeriodEnd, note, ...rest } = parsed.data;
  Object.assign(org, rest);

  if (extendDays) {
    const base = org.currentPeriodEnd && org.currentPeriodEnd.getTime() > Date.now() ? org.currentPeriodEnd : new Date();
    org.currentPeriodEnd = new Date(base.getTime() + extendDays * DAY_MS);
  } else if (currentPeriodEnd !== undefined) {
    org.currentPeriodEnd = currentPeriodEnd ? new Date(currentPeriodEnd) : null;
  }

  if (rest.plan && rest.plan !== before.plan) {
    org.planStartedAt = new Date();
    // A plan change implies the workspace is live unless the operator is
    // deliberately suspending it in the same request.
    if (!rest.subscriptionStatus && !["SUSPENDED", "CANCELLED"].includes(org.subscriptionStatus)) {
      org.subscriptionStatus = "ACTIVE";
    }
  }

  await org.save();

  const events: Array<Record<string, unknown>> = [];
  if (before.plan !== org.plan) {
    events.push({ type: "PLAN_CHANGED", fromPlan: before.plan, toPlan: org.plan, note: note || undefined });
  }
  if (before.subscriptionStatus !== org.subscriptionStatus) {
    events.push({
      type: "STATUS_CHANGED",
      fromStatus: before.subscriptionStatus,
      toStatus: org.subscriptionStatus,
      note: note || undefined,
    });
  }
  if (String(before.currentPeriodEnd ?? "") !== String(org.currentPeriodEnd ?? "")) {
    events.push({
      type: "PERIOD_EXTENDED",
      fromStatus: before.currentPeriodEnd ? before.currentPeriodEnd.toISOString() : null,
      toStatus: org.currentPeriodEnd ? org.currentPeriodEnd.toISOString() : null,
      note: note || undefined,
      metadata: { extendDays: extendDays ?? null },
    });
  }
  if (events.length) {
    await SubscriptionEvent.insertMany(
      events.map((event) => ({ ...event, organizationId: org._id, actorId: s.sub }))
    ).catch((e) => console.error("subscription event write failed", e));
  }

  await writeAudit({
    organizationId: params.id,
    actorId: s.sub,
    action: rest.plan && rest.plan !== before.plan ? "ORGANIZATION_PLAN_CHANGED" : "ORGANIZATION_UPDATED",
    targetType: "Organization",
    targetId: params.id,
    metadata: { ...parsed.data, previousPlan: before.plan, previousStatus: before.subscriptionStatus },
    ...auditContextFrom(req),
  });

  return NextResponse.json({
    ok: true,
    organization: {
      _id: String(org._id),
      plan: org.plan,
      subscriptionStatus: org.subscriptionStatus,
      planStartedAt: org.planStartedAt ?? null,
      currentPeriodEnd: org.currentPeriodEnd ?? null,
      billingExempt: org.billingExempt,
      status: org.status,
    },
  });
}
