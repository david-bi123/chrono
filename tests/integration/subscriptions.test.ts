/**
 * Integration: plan assignment, seat/branch limits and history windows.
 * Runs route handlers against a throwaway MongoDB (see helpers/integration).
 */
import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: () => ({
    get: (name: string) => {
      const jar = (globalThis as Record<string, unknown>).__jar as Record<string, string> | undefined;
      const v = jar?.[name];
      return v ? { name, value: v } : undefined;
    },
  }),
}));

import {
  closeDb,
  makeLocation,
  makeManager,
  makeOrgWithAdmin,
  makeStaff,
  makeSuperadmin,
  nextIp,
  req,
  setJar,
  useDb,
  wipe,
} from "../helpers/integration";
import { POST as createOrg } from "../../app/api/super-admin/organizations/route";
import { PATCH as patchOrg } from "../../app/api/super-admin/organizations/[id]/route";
import { GET as staffGet, POST as inviteStaff } from "../../app/api/org/staff/route";
import { GET as managersGet, POST as inviteManager } from "../../app/api/org/managers/route";
import { POST as createLocation } from "../../app/api/org/locations/route";
import { GET as attendanceGet } from "../../app/api/org/attendance/route";
import { GET as reportsGet } from "../../app/api/org/reports/route";
import { GET as subscriptionGet } from "../../app/api/org/subscription/route";
import { User } from "../../models/User";
import { Organization } from "../../models/Organization";
import { Attendance } from "../../models/Attendance";
import { SubscriptionEvent } from "../../models/SubscriptionEvent";

const hasDb = await useDb("chrono_test_subscriptions_v2");

const OLD_DATE = "2025-01-05";

async function superToken() {
  const { token } = await makeSuperadmin(`super-${Date.now()}-${Math.random()}@t.co`);
  setJar(token);
  return token;
}

describe.skipIf(!hasDb)("subscriptions (integration)", () => {
  beforeEach(async () => {
    await wipe();
    setJar(null);
  });
  afterAll(closeDb);

  it("creates an org with the selected plan and records the assignment", async () => {
    await superToken();
    const res = await createOrg(
      req("/api/super-admin/organizations", {
        method: "POST",
        ip: nextIp(),
        body: {
          name: "Growth Co",
          adminFirstName: "Ama",
          adminLastName: "Mensah",
          adminEmail: "ama@growth.co",
          plan: "GROWTH",
        },
      })
    );
    expect(res.status).toBe(201);
    const orgId = ((await res.json()) as { id: string }).id;

    const org = await Organization.findById(orgId).lean();
    expect(org?.plan).toBe("GROWTH");
    expect(org?.subscriptionStatus).toBe("ACTIVE");
    expect(org?.billingExempt).toBe(false);
    expect(org?.currentPeriodEnd).toBeTruthy();

    const event = await SubscriptionEvent.findOne({ organizationId: orgId }).lean();
    expect(event?.type).toBe("PLAN_ASSIGNED");
    expect(event?.toPlan).toBe("GROWTH");
  });

  it("defaults to Starter when no plan is sent", async () => {
    await superToken();
    const res = await createOrg(
      req("/api/super-admin/organizations", {
        method: "POST",
        ip: nextIp(),
        body: { name: "Plain Co", adminFirstName: "K", adminLastName: "O", adminEmail: "k@plain.co" },
      })
    );
    const orgId = ((await res.json()) as { id: string }).id;
    expect((await Organization.findById(orgId).lean())?.plan).toBe("STARTER");
  });

  it("blocks the 31st staff seat, counting pending invitations", async () => {
    const { org, token } = await makeOrgWithAdmin("Limit Co", "limit@test.co");
    setJar(token);
    for (let i = 0; i < 29; i++) {
      await makeStaff(org._id, `staff${i}@limit.co`);
    }
    await makeStaff(org._id, "pending@limit.co", false); // pending invitation

    const res = await inviteStaff(
      req("/api/org/staff", {
        method: "POST",
        ip: nextIp(),
        body: {
          firstName: "Too",
          lastName: "Many",
          email: "toomany@limit.co",
          employeeId: "E-TOO-MANY",
        },
      })
    );
    expect(res.status).toBe(403);
    const body = (await res.json()) as { code: string; details: { resource: string; usage: number; limit: number; upgradeTo: string } };
    expect(body.code).toBe("PLAN_LIMIT_REACHED");
    expect(body.details).toMatchObject({ resource: "staff", usage: 30, limit: 30, upgradeTo: "GROWTH" });
  });

  it("allows a staff invite below the limit", async () => {
    const { org, token } = await makeOrgWithAdmin("Room Co", "room@test.co");
    setJar(token);
    await makeStaff(org._id, "one@room.co");
    const res = await inviteStaff(
      req("/api/org/staff", {
        method: "POST",
        ip: nextIp(),
        body: { firstName: "New", lastName: "Person", email: "new@room.co", employeeId: "E-NEW" },
      })
    );
    expect(res.status).toBe(201);
  });

  it("blocks a second branch on Starter", async () => {
    const { org, token } = await makeOrgWithAdmin("Branch Co", "branch@test.co");
    setJar(token);
    await makeLocation(org._id, "token-one", "Gate");
    const res = await createLocation(
      req("/api/org/locations", { method: "POST", ip: nextIp(), body: { name: "Second site" } })
    );
    expect(res.status).toBe(403);
    const body = (await res.json()) as { code: string; details: { resource: string; limit: number } };
    expect(body.code).toBe("PLAN_LIMIT_REACHED");
    expect(body.details).toMatchObject({ resource: "branches", limit: 1 });
  });

  it("blocks the third manager seat on Starter", async () => {
    const { token } = await makeOrgWithAdmin("Manager Co", "manager-limit@test.co");
    setJar(token);
    for (const n of [1, 2]) {
      const ok = await inviteManager(
        req("/api/org/managers", {
          method: "POST",
          ip: nextIp(),
          body: { firstName: `Manager`, lastName: `${n}`, email: `m${n}@manager.co` },
        })
      );
      expect(ok.status).toBe(201);
    }
    const res = await inviteManager(
      req("/api/org/managers", {
        method: "POST",
        ip: nextIp(),
        body: { firstName: "One", lastName: "Too Many", email: "m3@manager.co" },
      })
    );
    expect(res.status).toBe(403);
    const body = (await res.json()) as {
      code: string;
      details: { resource: string; usage: number; limit: number; upgradeTo: string };
    };
    expect(body.code).toBe("PLAN_LIMIT_REACHED");
    expect(body.details).toMatchObject({ resource: "managers", usage: 2, limit: 2, upgradeTo: "GROWTH" });
  });

  it("gives managers read-only oversight (no staff or manager mutations)", async () => {
    const { org } = await makeOrgWithAdmin("Readonly Co", "readonly@test.co");
    await makeStaff(org._id, "ro-staff@readonly.co");
    const { token } = await makeManager(org._id, "ro-manager@readonly.co");
    setJar(token);

    expect((await staffGet(req("/api/org/staff"))).status).toBe(200);
    expect((await managersGet(req("/api/org/managers"))).status).toBe(200);

    const staffWrite = await inviteStaff(
      req("/api/org/staff", {
        method: "POST",
        ip: nextIp(),
        body: { firstName: "No", lastName: "Way", email: "nope@readonly.co", employeeId: "E-NOPE" },
      })
    );
    expect(staffWrite.status).toBe(403);

    const managerWrite = await inviteManager(
      req("/api/org/managers", {
        method: "POST",
        ip: nextIp(),
        body: { firstName: "No", lastName: "Way", email: "nope2@readonly.co" },
      })
    );
    expect(managerWrite.status).toBe(403);

    const branchWrite = await createLocation(
      req("/api/org/locations", { method: "POST", ip: nextIp(), body: { name: "Sneaky site" } })
    );
    expect(branchWrite.status).toBe(403);
  });

  it("refuses attendance older than the Starter history window", async () => {
    const { org, token } = await makeOrgWithAdmin("History Co", "history@test.co");
    const staff = await makeStaff(org._id, "hist@history.co");
    await Attendance.create({
      organizationId: org._id,
      staffId: staff._id,
      date: OLD_DATE,
      clockIn: new Date(`${OLD_DATE}T08:00:00Z`),
      status: "PRESENT",
    });
    setJar(token);

    const attendance = await attendanceGet(
      req(`/api/org/attendance?date=${OLD_DATE}`, { ip: nextIp() })
    );
    expect(attendance.status).toBe(403);
    expect(((await attendance.json()) as { code: string }).code).toBe("PLAN_LIMIT_REACHED");

    const reports = await reportsGet(
      req(`/api/org/reports?from=${OLD_DATE}&to=2025-02-01`, { ip: nextIp() })
    );
    expect(reports.status).toBe(403);
  });

  it("unlocks older history after an upgrade to Business", async () => {
    const { org, token } = await makeOrgWithAdmin("Upgrade Co", "upgrade@test.co");
    const staff = await makeStaff(org._id, "old@upgrade.co");
    await Attendance.create({
      organizationId: org._id,
      staffId: staff._id,
      date: OLD_DATE,
      clockIn: new Date(`${OLD_DATE}T08:00:00Z`),
      status: "PRESENT",
    });

    // Before: blocked (Starter).
    setJar(token);
    expect((await attendanceGet(req(`/api/org/attendance?date=${OLD_DATE}`, { ip: nextIp() }))).status).toBe(403);

    // Upgrade as super admin.
    await superToken();
    const patch = await patchOrg(
      req(`/api/super-admin/organizations/${String(org._id)}`, {
        method: "PATCH",
        ip: nextIp(),
        body: { plan: "BUSINESS", note: "Testing workspace" },
      }),
      { params: { id: String(org._id) } }
    );
    expect(patch.status).toBe(200);
    expect((await Organization.findById(org._id).lean())?.plan).toBe("BUSINESS");

    const events = await SubscriptionEvent.find({ organizationId: org._id }).sort({ createdAt: -1 }).lean();
    expect(events.some((e) => e.type === "PLAN_CHANGED" && e.toPlan === "BUSINESS")).toBe(true);

    // After: same request now succeeds.
    setJar(token);
    const after = await attendanceGet(req(`/api/org/attendance?date=${OLD_DATE}`, { ip: nextIp() }));
    expect(after.status).toBe(200);
  });

  it("reports plan usage to the org admin, including managers", async () => {
    const { org, token } = await makeOrgWithAdmin("Usage Co", "usage@test.co");
    setJar(token);
    await makeStaff(org._id, "u1@usage.co");
    await User.create({
      organizationId: org._id,
      role: "MANAGER",
      firstName: "M",
      lastName: "One",
      email: "m1@usage.co",
      status: "ACTIVE",
    });

    const res = await subscriptionGet();
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      subscription: { plan: { id: string }; usage: { staff: number; managers: number; branches: number }; limits: { staff: number } };
      plans: Array<{ id: string; priceGhs: number }>;
    };
    expect(body.subscription.plan.id).toBe("STARTER");
    expect(body.subscription.usage).toMatchObject({ staff: 1, managers: 1, branches: 0 });
    expect(body.subscription.limits.staff).toBe(30);
    expect(body.plans.map((p) => p.priceGhs)).toEqual([500, 750, 1000]);
  });

  it("suspends a workspace when the super admin marks the subscription suspended", async () => {
    const { org, token } = await makeOrgWithAdmin("Suspend Co", "suspend@test.co");
    await superToken();
    const res = await patchOrg(
      req(`/api/super-admin/organizations/${String(org._id)}`, {
        method: "PATCH",
        ip: nextIp(),
        body: { subscriptionStatus: "SUSPENDED" },
      }),
      { params: { id: String(org._id) } }
    );
    expect(res.status).toBe(200);

    setJar(token);
    const invite = await inviteStaff(
      req("/api/org/staff", {
        method: "POST",
        ip: nextIp(),
        body: { firstName: "No", lastName: "Write", email: "nowrite@suspend.co", employeeId: "E-NO" },
      })
    );
    expect(invite.status).toBe(403);
    expect(((await invite.json()) as { code: string }).code).toBe("SUBSCRIPTION_INACTIVE");
  });
});
