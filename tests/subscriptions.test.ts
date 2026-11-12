import { describe, it, expect } from "vitest";
import {
  assertActiveSubscription,
  assertCanAdd,
  assertHistoryAccess,
  computeEntitlements,
  PlanLimitError,
  SubscriptionInactiveError,
  monthsAgoDateKey,
} from "@/lib/subscriptions/entitlements";
import { PLANS, formatGhs, getPlan, upgradeOptions } from "@/lib/subscriptions/plans";

const NOW = new Date("2026-11-12T12:00:00.000Z");

function org(overrides: Record<string, unknown> = {}) {
  return {
    _id: "65f000000000000000000001",
    name: "SamTech Labs",
    status: "ACTIVE" as const,
    plan: "STARTER" as const,
    subscriptionStatus: "ACTIVE" as const,
    attendanceSettings: { timezone: "Africa/Accra" },
    ...overrides,
  };
}

describe("plan catalog", () => {
  it("prices the three plans in GHS", () => {
    expect(PLANS.STARTER.priceGhs).toBe(500);
    expect(PLANS.GROWTH.priceGhs).toBe(750);
    expect(PLANS.BUSINESS.priceGhs).toBe(1000);
  });

  it("sets the advertised limits", () => {
    expect(PLANS.STARTER.limits).toMatchObject({ staff: 30, managers: 2, branches: 1, historyMonths: 6 });
    expect(PLANS.GROWTH.limits).toMatchObject({ staff: 70, managers: 5, branches: 3, historyMonths: 12 });
    expect(PLANS.BUSINESS.limits).toMatchObject({ staff: null, managers: null, branches: null, historyMonths: null });
  });

  it("falls back to Starter for missing or unknown plans", () => {
    expect(getPlan(undefined).id).toBe("STARTER");
    expect(getPlan("ENTERPRISE").id).toBe("STARTER");
  });

  it("lists upgrades cheapest first and formats cedis", () => {
    expect(upgradeOptions("STARTER").map((p) => p.id)).toEqual(["GROWTH", "BUSINESS"]);
    expect(upgradeOptions("BUSINESS")).toEqual([]);
    expect(formatGhs(1000)).toBe("GH₵1,000");
  });
});

describe("entitlements", () => {
  it("derives usage, remaining seats and the history window", () => {
    const ent = computeEntitlements(org(), { staff: 24, managers: 1, branches: 1 }, NOW);
    expect(ent.plan.id).toBe("STARTER");
    expect(ent.remaining).toEqual({ staff: 6, managers: 1, branches: 0 });
    expect(ent.historyMonths).toBe(6);
    expect(ent.oldestHistoryDate).toBe("2026-05-12");
    expect(ent.upgradeTo).toBe("GROWTH");
    expect(ent.isOperational).toBe(true);
  });

  it("treats a missing plan as Starter and unlimited history as null", () => {
    const ent = computeEntitlements(org({ plan: undefined }), { staff: 0, managers: 0, branches: 0 }, NOW);
    expect(ent.plan.id).toBe("STARTER");
    const business = computeEntitlements(org({ plan: "BUSINESS" }), { staff: 120, managers: 9, branches: 7 }, NOW);
    expect(business.oldestHistoryDate).toBeNull();
    expect(business.remaining.staff).toBeNull();
    expect(business.upgradeTo).toBeNull();
  });

  it("blocks writes past a seat limit and explains the upgrade", () => {
    const ent = computeEntitlements(org(), { staff: 30, managers: 0, branches: 0 }, NOW);
    expect(() => assertCanAdd(ent, "staff")).toThrow(PlanLimitError);
    try {
      assertCanAdd(ent, "staff");
    } catch (e) {
      const err = e as PlanLimitError;
      expect(err.code).toBe("PLAN_LIMIT_REACHED");
      expect(err.resource).toBe("staff");
      expect(err.limit).toBe(30);
      expect(err.upgradeTo).toBe("GROWTH");
      expect(err.message).toContain("30");
    }
  });

  it("allows adding while under the limit", () => {
    const ent = computeEntitlements(org(), { staff: 29, managers: 0, branches: 0 }, NOW);
    expect(() => assertCanAdd(ent, "staff")).not.toThrow();
    expect(() => assertCanAdd(ent, "branches")).not.toThrow();
  });

  it("blocks branches for Starter at 1 and managers at 2", () => {
    const branchFull = computeEntitlements(org(), { staff: 0, managers: 0, branches: 1 }, NOW);
    expect(() => assertCanAdd(branchFull, "branches")).toThrow(PlanLimitError);
    const managersFull = computeEntitlements(org(), { staff: 0, managers: 2, branches: 0 }, NOW);
    expect(() => assertCanAdd(managersFull, "managers")).toThrow(PlanLimitError);
  });

  it("treats suspended and cancelled subscriptions as non-operational", () => {
    const suspended = computeEntitlements(org({ subscriptionStatus: "SUSPENDED" }), { staff: 0, managers: 0, branches: 0 }, NOW);
    expect(() => assertActiveSubscription(suspended)).toThrow(SubscriptionInactiveError);
    const pastDue = computeEntitlements(org({ subscriptionStatus: "PAST_DUE" }), { staff: 0, managers: 0, branches: 0 }, NOW);
    expect(() => assertActiveSubscription(pastDue)).not.toThrow();
    const orgSuspended = computeEntitlements(org({ status: "SUSPENDED" }), { staff: 0, managers: 0, branches: 0 }, NOW);
    expect(orgSuspended.isOperational).toBe(false);
  });

  it("enforces the attendance history window", () => {
    const ent = computeEntitlements(org(), { staff: 0, managers: 0, branches: 0 }, NOW);
    expect(assertHistoryAccess(ent, "2026-06-01")).toBe("2026-06-01");
    expect(assertHistoryAccess(ent, null)).toBe("2026-05-12");
    expect(() => assertHistoryAccess(ent, "2026-04-30")).toThrow(PlanLimitError);
    const business = computeEntitlements(org({ plan: "BUSINESS" }), { staff: 0, managers: 0, branches: 0 }, NOW);
    expect(assertHistoryAccess(business, "2020-01-01")).toBe("2020-01-01");
  });

  it("handles month boundaries in the org timezone", () => {
    expect(monthsAgoDateKey(new Date("2026-03-31T12:00:00Z"), "Africa/Accra", 1)).toBe("2026-02-28");
    expect(monthsAgoDateKey(new Date("2026-01-15T12:00:00Z"), "Africa/Accra", 6)).toBe("2025-07-15");
  });
});
