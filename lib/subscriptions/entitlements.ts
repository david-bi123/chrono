/**
 * Server-side entitlement engine.
 *
 * A plan is only real if the API enforces it. Routes call the guards below
 * (never `org.plan === "GROWTH"` comparisons) so limits stay consistent and
 * every rejection carries the same structured payload for the UI to explain.
 */
import { format, subMonths } from "date-fns";
import { toZonedTime } from "date-fns-tz";

import { User } from "@/models/User";
import { AttendanceLocation } from "@/models/AttendanceLocation";
import { Organization } from "@/models/Organization";
import {
  getPlan,
  upgradeOptions,
  type PlanDefinition,
  type PlanFeature,
  type PlanId,
  type PlanLimits,
  type SubscriptionStatus,
} from "./plans";

export type CountedResource = "staff" | "managers" | "branches";
export type LimitResource = CountedResource | "history";

export interface Usage {
  staff: number;
  managers: number;
  branches: number;
}

export interface Entitlements {
  organizationId: string;
  organizationName: string;
  plan: PlanDefinition;
  subscriptionStatus: SubscriptionStatus;
  planStartedAt: Date | null;
  currentPeriodEnd: Date | null;
  billingExempt: boolean;
  usage: Usage;
  limits: PlanLimits;
  features: PlanFeature[];
  remaining: { staff: number | null; managers: number | null; branches: number | null };
  historyMonths: number | null;
  /** Oldest attendance date this plan may read, `YYYY-MM-DD`, or null = unlimited. */
  oldestHistoryDate: string | null;
  upgradeTo: PlanId | null;
  /** False when the org or its subscription may no longer write. */
  isOperational: boolean;
  timezone: string;
}

interface OrgRecord {
  _id: unknown;
  name: string;
  status: "ACTIVE" | "SUSPENDED";
  plan?: string | null;
  subscriptionStatus?: string | null;
  planStartedAt?: Date | null;
  currentPeriodEnd?: Date | null;
  billingExempt?: boolean | null;
  attendanceSettings?: { timezone?: string } | null;
}

const VALID_STATUS: SubscriptionStatus[] = ["ACTIVE", "PAST_DUE", "SUSPENDED", "CANCELLED"];

function normalizeStatus(value: string | null | undefined): SubscriptionStatus {
  return value && (VALID_STATUS as string[]).includes(value) ? (value as SubscriptionStatus) : "ACTIVE";
}

export class PlanLimitError extends Error {
  readonly statusCode = 403;
  readonly code = "PLAN_LIMIT_REACHED";
  constructor(
    readonly resource: LimitResource,
    readonly usage: number,
    readonly limit: number,
    readonly plan: PlanId,
    readonly upgradeTo: PlanId | null,
    message: string
  ) {
    super(message);
    this.name = "PlanLimitError";
  }
}

export class SubscriptionInactiveError extends Error {
  readonly statusCode = 403;
  readonly code = "SUBSCRIPTION_INACTIVE";
  constructor(readonly subscriptionStatus: SubscriptionStatus, message: string) {
    super(message);
    this.name = "SubscriptionInactiveError";
  }
}

export class FeatureNotInPlanError extends Error {
  readonly statusCode = 403;
  readonly code = "FEATURE_NOT_IN_PLAN";
  constructor(
    readonly feature: PlanFeature,
    readonly plan: PlanId,
    readonly upgradeTo: PlanId | null,
    message: string
  ) {
    super(message);
    this.name = "FeatureNotInPlanError";
  }
}

/** Shape returned to API clients so the UI can show usage + an upgrade path. */
export function planErrorPayload(error: unknown) {
  if (error instanceof PlanLimitError) {
    return {
      status: error.statusCode,
      body: {
        error: error.message,
        code: error.code,
        details: {
          resource: error.resource,
          usage: error.usage,
          limit: error.limit,
          plan: error.plan,
          upgradeTo: error.upgradeTo,
        },
      },
    };
  }
  if (error instanceof SubscriptionInactiveError) {
    return {
      status: error.statusCode,
      body: { error: error.message, code: error.code, details: { subscriptionStatus: error.subscriptionStatus } },
    };
  }
  if (error instanceof FeatureNotInPlanError) {
    return {
      status: error.statusCode,
      body: {
        error: error.message,
        code: error.code,
        details: { feature: error.feature, plan: error.plan, upgradeTo: error.upgradeTo },
      },
    };
  }
  return null;
}

export function monthsAgoDateKey(now: Date, timezone: string, months: number): string {
  return format(subMonths(toZonedTime(now, timezone), months), "yyyy-MM-dd");
}

export function computeEntitlements(
  org: OrgRecord,
  usage: Usage,
  now: Date = new Date()
): Entitlements {
  const plan = getPlan(org.plan);
  const subscriptionStatus = normalizeStatus(org.subscriptionStatus);
  const timezone = org.attendanceSettings?.timezone || "Africa/Accra";
  const unlimited = plan.limits.historyMonths === null;
  const remainingOf = (limit: number | null, used: number) =>
    limit === null ? null : Math.max(0, limit - used);
  const nextPlan = upgradeOptions(plan.id)[0]?.id ?? null;

  return {
    organizationId: String(org._id),
    organizationName: org.name,
    plan,
    subscriptionStatus,
    planStartedAt: org.planStartedAt ?? null,
    currentPeriodEnd: org.currentPeriodEnd ?? null,
    billingExempt: Boolean(org.billingExempt),
    usage,
    limits: plan.limits,
    features: plan.features,
    remaining: {
      staff: remainingOf(plan.limits.staff, usage.staff),
      managers: remainingOf(plan.limits.managers, usage.managers),
      branches: remainingOf(plan.limits.branches, usage.branches),
    },
    historyMonths: plan.limits.historyMonths,
    oldestHistoryDate: unlimited
      ? null
      : monthsAgoDateKey(now, timezone, plan.limits.historyMonths as number),
    upgradeTo: nextPlan,
    isOperational:
      org.status === "ACTIVE" && (subscriptionStatus === "ACTIVE" || subscriptionStatus === "PAST_DUE"),
    timezone,
  };
}

export async function getEntitlements(organizationId: string, now: Date = new Date()): Promise<Entitlements | null> {
  const org = (await Organization.findById(organizationId).lean()) as unknown as OrgRecord | null;
  if (!org) return null;

  const [staff, managers, branches] = await Promise.all([
    // Pending invitations exist as PENDING users, so one query covers seats
    // in use — active and invited. Disabled accounts free their seat.
    User.countDocuments({ organizationId: org._id, role: "STAFF", status: { $ne: "DISABLED" } }),
    User.countDocuments({ organizationId: org._id, role: "MANAGER", status: { $ne: "DISABLED" } }),
    AttendanceLocation.countDocuments({ organizationId: org._id, status: "ACTIVE" }),
  ]);

  return computeEntitlements(org, { staff, managers, branches }, now);
}

export function assertActiveSubscription(ent: Entitlements): void {
  if (!ent.isOperational) {
    throw new SubscriptionInactiveError(
      ent.subscriptionStatus,
      ent.subscriptionStatus === "PAST_DUE"
        ? "This workspace has a past-due subscription. Contact SamTech Labs to restore access."
        : "This workspace's subscription is not active. Contact SamTech Labs to reactivate it."
    );
  }
}

const RESOURCE_LABEL: Record<LimitResource, string> = {
  staff: "staff",
  managers: "manager",
  branches: "branch",
  history: "attendance history",
};

export function assertCanAdd(ent: Entitlements, resource: CountedResource): void {
  const limit = resource === "staff" ? ent.limits.staff : resource === "managers" ? ent.limits.managers : ent.limits.branches;
  const usage = resource === "staff" ? ent.usage.staff : resource === "managers" ? ent.usage.managers : ent.usage.branches;
  if (limit !== null && usage >= limit) {
    const noun = RESOURCE_LABEL[resource];
    throw new PlanLimitError(
      resource,
      usage,
      limit,
      ent.plan.id,
      ent.upgradeTo,
      `Your ${ent.plan.name} plan allows ${limit} ${noun}${limit === 1 ? "" : "s"}. You're using ${usage} of ${limit}. Upgrade to add more.`
    );
  }
}

export function hasFeature(ent: Entitlements, feature: PlanFeature): boolean {
  return ent.features.includes(feature);
}

export function assertFeature(ent: Entitlements, feature: PlanFeature, label: string): void {
  if (!hasFeature(ent, feature)) {
    throw new FeatureNotInPlanError(
      feature,
      ent.plan.id,
      ent.upgradeTo,
      `${label} is available on Growth and Business plans. Your workspace is on ${ent.plan.name}.`
    );
  }
}

/**
 * Enforce the plan's history window for date-bounded reads.
 * Returns the effective `from` key (unchanged when unlimited) and throws when
 * the caller asks for data older than the plan allows.
 */
export function assertHistoryAccess(ent: Entitlements, requestedFrom: string | null | undefined): string | null {
  if (ent.oldestHistoryDate === null) return requestedFrom ?? null;
  if (!requestedFrom) return ent.oldestHistoryDate;
  if (requestedFrom < ent.oldestHistoryDate) {
    throw new PlanLimitError(
      "history",
      ent.historyMonths ?? 0,
      ent.historyMonths ?? 0,
      ent.plan.id,
      ent.upgradeTo,
      `Your ${ent.plan.name} plan includes ${ent.historyMonths} months of attendance history. Records before ${ent.oldestHistoryDate} need an upgrade.`
    );
  }
  return requestedFrom;
}
