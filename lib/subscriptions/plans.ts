/**
 * Single source of truth for ChronoSwift's commercial plans.
 *
 * Everything that gates a feature or a limit reads from here — API routes,
 * dashboards and the super-admin console. Never compare plan IDs inline in a
 * route; ask the entitlement layer instead.
 */

export const PLAN_IDS = ["STARTER", "GROWTH", "BUSINESS"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export type SubscriptionStatus = "ACTIVE" | "PAST_DUE" | "SUSPENDED" | "CANCELLED";

export type PlanFeature =
  | "attendance.core"
  | "staff.manage"
  | "qr.clock"
  | "reports.basic"
  | "exports.csv"
  | "analytics.advanced"
  | "reports.branch"
  | "corrections"
  | "exports.advanced"
  | "analytics.org"
  | "reports.compare"
  | "audit.logs"
  | "roles.advanced"
  | "support.priority";

export interface PlanLimits {
  /** null = unlimited */
  staff: number | null;
  managers: number | null;
  branches: number | null;
  /** null = unlimited */
  historyMonths: number | null;
}

export interface PlanDefinition {
  id: PlanId;
  name: string;
  priceGhs: number;
  tagline: string;
  description: string;
  limits: PlanLimits;
  features: PlanFeature[];
  highlights: string[];
}

const CORE: PlanFeature[] = ["attendance.core", "staff.manage", "qr.clock", "reports.basic", "exports.csv"];

export const PLANS: Record<PlanId, PlanDefinition> = {
  STARTER: {
    id: "STARTER",
    name: "Starter",
    priceGhs: 500,
    tagline: "For one location getting attendance under control.",
    description:
      "Everything a single-site team needs to clock in by QR, spot lateness and export clean attendance records.",
    limits: { staff: 30, managers: 2, branches: 1, historyMonths: 6 },
    features: CORE,
    highlights: [
      "Up to 30 staff accounts",
      "1 branch and 2 managers",
      "6 months of attendance history",
      "QR clock-in, live monitoring, CSV export",
    ],
  },
  GROWTH: {
    id: "GROWTH",
    name: "Growth",
    priceGhs: 750,
    tagline: "For growing teams and multi-branch operations.",
    description:
      "Adds the reporting depth, correction workflow and branch visibility that HR teams need as headcount grows.",
    limits: { staff: 70, managers: 5, branches: 3, historyMonths: 12 },
    features: [
      ...CORE,
      "analytics.advanced",
      "reports.branch",
      "corrections",
      "exports.advanced",
    ],
    highlights: [
      "Up to 70 staff across 3 branches",
      "5 manager accounts",
      "12 months of attendance history",
      "Attendance trends, branch reports, corrections",
    ],
  },
  BUSINESS: {
    id: "BUSINESS",
    name: "Business",
    priceGhs: 1000,
    tagline: "For organisations that run attendance at scale.",
    description:
      "Unlimited people and branches, organisation-wide analytics, comparative reporting and a full audit trail.",
    limits: { staff: null, managers: null, branches: null, historyMonths: null },
    features: [
      ...CORE,
      "analytics.advanced",
      "reports.branch",
      "corrections",
      "exports.advanced",
      "analytics.org",
      "reports.compare",
      "audit.logs",
      "roles.advanced",
      "support.priority",
    ],
    highlights: [
      "Unlimited staff, managers and branches",
      "Unlimited attendance history",
      "Organisation-wide and comparative analytics",
      "Audit logs, advanced roles, priority support",
    ],
  },
};

export const PLAN_LIST: PlanDefinition[] = PLAN_IDS.map((id) => PLANS[id]);

/** Missing/unknown values fall back to Starter — never unlock by accident. */
export function getPlan(id: string | null | undefined): PlanDefinition {
  return id && isPlanId(id) ? PLANS[id] : PLANS.STARTER;
}

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && (PLAN_IDS as readonly string[]).includes(value);
}

export function planRank(id: PlanId): number {
  return PLAN_IDS.indexOf(id);
}

/** Plans strictly above `id`, cheapest first. */
export function upgradeOptions(id: PlanId): PlanDefinition[] {
  const rank = planRank(id);
  return PLAN_LIST.filter((plan) => planRank(plan.id) > rank);
}

export function planHasFeature(plan: PlanDefinition, feature: PlanFeature): boolean {
  return plan.features.includes(feature);
}

/** "GH₵1,000" */
export function formatGhs(amount: number): string {
  return `GH₵${amount.toLocaleString("en-GH")}`;
}
