import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/mongoose";
import { getSession } from "@/lib/auth/session";
import { getEntitlements } from "@/lib/subscriptions/entitlements";
import { PLAN_LIST } from "@/lib/subscriptions/plans";
import { SubscriptionEvent } from "@/models/SubscriptionEvent";
import { Payment } from "@/models/Payment";

/**
 * The organisation's own view of its plan: usage, limits and renewal date.
 * Managers can read it (so they understand why an action was blocked);
 * only the org admin can change anything, and today changes go through
 * SamTech Labs / the super admin console.
 */
export async function GET() {
  const s = await getSession();
  if (!s || !s.orgId || !["ORGANIZATION_ADMIN", "MANAGER"].includes(s.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await dbConnect();
  const entitlements = await getEntitlements(s.orgId);
  if (!entitlements) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const events = await SubscriptionEvent.find({ organizationId: s.orgId, type: { $in: ["PLAN_CHANGED", "PLAN_ASSIGNED", "STATUS_CHANGED", "PERIOD_EXTENDED", "PAYMENT_SUCCEEDED"] } })
    .sort({ createdAt: -1 })
    .limit(12)
    .lean();

  const payments = await Payment.find({ organizationId: s.orgId })
    .sort({ createdAt: -1 })
    .limit(12)
    .select("reference plan amountGhs status paidAt createdAt channel")
    .lean();

  return NextResponse.json({
    subscription: {
      plan: entitlements.plan,
      status: entitlements.subscriptionStatus,
      planStartedAt: entitlements.planStartedAt,
      currentPeriodEnd: entitlements.currentPeriodEnd,
      billingExempt: entitlements.billingExempt,
      usage: entitlements.usage,
      limits: entitlements.limits,
      remaining: entitlements.remaining,
      historyMonths: entitlements.historyMonths,
      oldestHistoryDate: entitlements.oldestHistoryDate,
      upgradeTo: entitlements.upgradeTo,
    },
    plans: PLAN_LIST,
    payments: payments.map((p) => {
      const r = p as unknown as Record<string, unknown>;
      return { ...r, _id: String(r._id) };
    }),
    events: events.map((e) => {
      const r = e as unknown as Record<string, unknown>;
      return { ...r, _id: String(r._id) };
    }),
  });
}
