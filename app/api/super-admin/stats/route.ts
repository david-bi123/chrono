import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/mongoose";
import { Organization } from "@/models/Organization";
import { User } from "@/models/User";
import { Attendance } from "@/models/Attendance";
import { getSession } from "@/lib/auth/session";
import { PLANS, getPlan } from "@/lib/subscriptions/plans";

export async function GET() {
  const s = await getSession();
  if (!s || s.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await dbConnect();

  const [orgs, staff, admins, managers, todayCount, planCounts, exemptCount] = await Promise.all([
    Organization.countDocuments(),
    User.countDocuments({ role: "STAFF", status: "ACTIVE" }),
    User.countDocuments({ role: "ORGANIZATION_ADMIN" }),
    User.countDocuments({ role: "MANAGER", status: { $ne: "DISABLED" } }),
    Attendance.countDocuments({ date: new Date().toISOString().slice(0, 10) }),
    Organization.aggregate([
      { $group: { _id: { $ifNull: ["$plan", "STARTER"] }, n: { $sum: 1 }, exempt: { $sum: { $cond: ["$billingExempt", 1, 0] } } } },
    ]),
    Organization.countDocuments({ billingExempt: true }),
  ]);

  // List-price MRR: active, non-exempt workspaces only. This is a computed
  // figure from the plan catalog, not a stored billing metric.
  const activeBillable = await Organization.find({
    status: "ACTIVE",
    subscriptionStatus: { $in: ["ACTIVE", "PAST_DUE"] },
    billingExempt: { $ne: true },
  })
    .select("plan")
    .lean();
  const mrr = activeBillable.reduce((sum, o) => sum + getPlan((o as { plan?: string }).plan).priceGhs, 0);

  const soon = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const renewalsDue = await Organization.countDocuments({
    status: "ACTIVE",
    billingExempt: { $ne: true },
    currentPeriodEnd: { $gte: new Date(), $lte: soon },
  });

  const byPlan = (id: string) => {
    const row = planCounts.find((p) => p._id === id);
    return row ? row.n : 0;
  };

  const recentOrgs = await Organization.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select("name email status plan subscriptionStatus currentPeriodEnd billingExempt createdAt")
    .lean();

  return NextResponse.json({
    orgs,
    staff,
    admins,
    managers,
    todayCount,
    mrr,
    renewalsDue,
    billingExempt: exemptCount,
    plans: {
      STARTER: byPlan("STARTER"),
      GROWTH: byPlan("GROWTH"),
      BUSINESS: byPlan("BUSINESS"),
    },
    prices: { STARTER: PLANS.STARTER.priceGhs, GROWTH: PLANS.GROWTH.priceGhs, BUSINESS: PLANS.BUSINESS.priceGhs },
    recentOrgs,
  });
}
