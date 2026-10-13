/**
 * Integration: staff invites, QR scan/clock flow, tenant guards, settings
 * validation, password policy and login rate limiting — against real MongoDB.
 */
import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: () => ({
    get: (name: string) => {
      const jar = (globalThis as Record<string, unknown>).__jar as
        | Record<string, string>
        | undefined;
      const v = jar?.[name];
      return v ? { name, value: v } : undefined;
    },
  }),
}));

import {
  useDb,
  closeDb,
  wipe,
  req,
  setJar,
  makeOrgWithAdmin,
  makeStaff,
  makeLocation,
  loginAs,
  nextIp,
} from "../helpers/integration";
import { POST as inviteStaff } from "../../app/api/org/staff/route";
import { POST as resendStaff } from "../../app/api/org/staff/[id]/resend/route";
import {
  GET as acceptGet,
  POST as acceptPost,
} from "../../app/api/auth/accept-invitation/route";
import { POST as login } from "../../app/api/auth/login/route";
import { GET as scanGet } from "../../app/api/attendance/scan/[token]/route";
import { POST as clock } from "../../app/api/attendance/clock/route";
import { PATCH as settingsPatch } from "../../app/api/org/settings/route";
import { PATCH as profilePatch } from "../../app/api/staff/profile/route";
import { User } from "../../models/User";

const hasDb = await useDb("chrono_test_staff");

function tokenOf(link: string): string {
  return new URL(link).searchParams.get("token") || "";
}

describe.skipIf(!hasDb)("staff + attendance (integration)", () => {
  beforeEach(async () => {
    await wipe();
    setJar(null);
  });
  afterAll(closeDb);

  async function adminCtx() {
    const { org, admin, token } = await makeOrgWithAdmin("Acme", "admin@ac.me");
    setJar(token);
    return { org, admin, token };
  }

  const staffBody = (email: string, employeeId = "E-1") => ({
    firstName: "Kim",
    lastName: "Lee",
    email,
    employeeId,
  });

  it("invites staff, rejects duplicates, resends with rotation", async () => {
    await adminCtx();
    const ip = nextIp();
    const r = await inviteStaff(
      req("/api/org/staff", { method: "POST", body: staffBody("kim@t.co"), ip })
    );
    expect(r.status).toBe(201);
    const d = (await r.json()) as { ok: boolean; id: string; emailSent: boolean; setupLink: string };
    expect(d.ok).toBe(true);
    expect(d.emailSent).toBe(false);
    const firstToken = tokenOf(d.setupLink);

    const dupEmail = await inviteStaff(
      req("/api/org/staff", { method: "POST", body: staffBody("kim@t.co", "E-2"), ip: nextIp() })
    );
    expect(dupEmail.status).toBe(409);

    const dupId = await inviteStaff(
      req("/api/org/staff", { method: "POST", body: staffBody("other@t.co", "E-1"), ip: nextIp() })
    );
    expect(dupId.status).toBe(409);

    const re = await resendStaff(
      req(`/api/org/staff/${d.id}/resend`, { method: "POST", ip: nextIp() }),
      { params: { id: d.id } }
    );
    expect(re.status).toBe(200);
    const rd = (await re.json()) as { ok: boolean; setupLink: string };
    const secondToken = tokenOf(rd.setupLink);
    expect(secondToken).not.toBe(firstToken);

    const dead = await acceptGet(req(`/api/auth/accept-invitation?token=${firstToken}`, { ip: nextIp() }));
    expect(dead.status).toBe(400);

    const ok = await acceptPost(
      req("/api/auth/accept-invitation", {
        method: "POST",
        body: { token: secondToken, password: "Strong1Pass" },
        ip: nextIp(),
      })
    );
    expect(ok.status).toBe(200);
    const u = (await User.findOne({ email: "kim@t.co" }).lean()) as unknown as { status: string };
    expect(u.status).toBe("ACTIVE");
  });

  it("runs the full scan → clock in → clock out loop with guards", async () => {
    const { org } = await adminCtx();
    const raw = `chr_test_${Date.now()}`;
    await makeLocation(org._id, raw);
    await makeStaff(org._id, "sam@t.co", true);

    // Logged-out scan: public, shows signed-out state (middleware regression).
    // NOTE: adminCtx() leaves an admin session in the jar — clear it first.
    setJar(null);
    const pub = await scanGet(req(`/api/attendance/scan/${raw}`, { ip: nextIp() }), {
      params: { token: raw },
    });
    expect(pub.status).toBe(200);
    const pd = (await pub.json()) as { authenticated: boolean; belongs: boolean };
    expect(pd.authenticated).toBe(false);
    expect(pd.belongs).toBe(false);

    // Real staff login, then scan shows membership with no record yet.
    const cookie = await loginAs("sam@t.co", "Fixture123!", nextIp());
    setJar(cookie);
    const mine = await scanGet(req(`/api/attendance/scan/${raw}`, { ip: nextIp() }), {
      params: { token: raw },
    });
    const md = (await mine.json()) as { authenticated: boolean; belongs: boolean; attendance: unknown };
    expect(md.authenticated).toBe(true);
    expect(md.belongs).toBe(true);
    expect(md.attendance).toBeNull();

    const body = { locationToken: raw };
    const cin = await clock(
      req("/api/attendance/clock?mode=in", { method: "POST", body, ip: nextIp() })
    );
    expect(cin.status).toBe(200);
    const cinBody = (await cin.json()) as { ok: boolean };
    expect(cinBody.ok).toBe(true);

    const cin2 = await clock(
      req("/api/attendance/clock?mode=in", { method: "POST", body, ip: nextIp() })
    );
    expect(cin2.status).toBe(409);

    const cout = await clock(
      req("/api/attendance/clock?mode=out", { method: "POST", body, ip: nextIp() })
    );
    expect(cout.status).toBe(200);
    const coutBody = (await cout.json()) as { ok: boolean; attendance: { totalMinutes: number } };
    expect(coutBody.ok).toBe(true);
    expect(typeof coutBody.attendance.totalMinutes).toBe("number");

    const cout2 = await clock(
      req("/api/attendance/clock?mode=out", { method: "POST", body, ip: nextIp() })
    );
    expect(cout2.status).toBe(409);
  });

  it("blocks cross-organization QR use twice (display + record)", async () => {
    const { org } = await adminCtx();
    const other = await makeOrgWithAdmin("Other", "boss@other.co");
    const rawB = `chr_other_${Date.now()}`;
    await makeLocation(other.org._id, rawB);
    await makeStaff(org._id, "sam@t.co", true);
    const cookie = await loginAs("sam@t.co", "Fixture123!", nextIp());
    setJar(cookie);

    const seen = await scanGet(req(`/api/attendance/scan/${rawB}`, { ip: nextIp() }), {
      params: { token: rawB },
    });
    const sd = (await seen.json()) as { belongs: boolean; orgName: string };
    expect(sd.belongs).toBe(false);

    const attempt = await clock(
      req("/api/attendance/clock?mode=in", {
        method: "POST",
        body: { locationToken: rawB },
        ip: nextIp(),
      })
    );
    expect(attempt.status).toBe(403);
  });

  it("rejects bad tokens and logged-out clock attempts as JSON", async () => {
    const bad = await scanGet(req("/api/attendance/scan/chr_nope12345678", { ip: nextIp() }), {
      params: { token: "chr_nope12345678" },
    });
    expect(bad.status).toBe(404);

    setJar(null);
    const anon = await clock(
      req("/api/attendance/clock?mode=in", {
        method: "POST",
        body: { locationToken: "chr_nope12345678" },
        ip: nextIp(),
      })
    );
    expect(anon.status).toBe(401);
  });

  it("validates settings timezones and password policy at the API", async () => {
    await adminCtx();
    const badTz = await settingsPatch(
      req("/api/org/settings", {
        method: "PATCH",
        body: { attendance: { timezone: "Mars/Olympus" } },
        ip: nextIp(),
      })
    );
    expect(badTz.status).toBe(400);

    const goodTz = await settingsPatch(
      req("/api/org/settings", {
        method: "PATCH",
        body: { attendance: { timezone: "Europe/London" } },
        ip: nextIp(),
      })
    );
    expect(goodTz.status).toBe(200);
  });

  it("enforces the password policy on change and accepts strong ones", async () => {
    const { org } = await adminCtx();
    await makeStaff(org._id, "sam@t.co", true);
    const cookie = await loginAs("sam@t.co", "Fixture123!", nextIp());
    setJar(cookie);

    const weak = await profilePatch(
      req("/api/staff/profile", {
        method: "PATCH",
        body: { currentPassword: "Fixture123!", newPassword: "weakpass" },
        ip: nextIp(),
      })
    );
    expect(weak.status).toBe(400);

    const strong = await profilePatch(
      req("/api/staff/profile", {
        method: "PATCH",
        body: { currentPassword: "Fixture123!", newPassword: "NewStrong1!" },
        ip: nextIp(),
      })
    );
    expect(strong.status).toBe(200);

    setJar(null);
    const relogin = await login(
      req("/api/auth/login", {
        method: "POST",
        body: { email: "sam@t.co", password: "NewStrong1!" },
        ip: nextIp(),
      })
    );
    expect(relogin.status).toBe(200);
  });

  it("rate-limits repeated login attempts", async () => {
    const ip = "10.99.0.7";
    let last = 0;
    for (let i = 0; i < 11; i++) {
      const r = await login(
        req("/api/auth/login", {
          method: "POST",
          body: { email: "ghost@t.co", password: "nope" },
          ip,
        })
      );
      last = r.status;
    }
    expect(last).toBe(429);
  }, 20000);
});
