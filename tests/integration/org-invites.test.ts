/**
 * Integration: super-admin org provisioning, invitation rotation and account
 * acceptance — route handlers against a real MongoDB (see helpers/integration).
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
  makeSuperadmin,
  makeOrgWithAdmin,
  nextIp,
} from "../helpers/integration";
import { POST as createOrg } from "../../app/api/super-admin/organizations/route";
import { POST as resendOrg } from "../../app/api/super-admin/organizations/[id]/resend/route";
import {
  GET as acceptGet,
  POST as acceptPost,
} from "../../app/api/auth/accept-invitation/route";
import { POST as login } from "../../app/api/auth/login/route";
import { User } from "../../models/User";
import { Organization } from "../../models/Organization";
import { Invitation } from "../../models/Invitation";

const hasDb = await useDb("chrono_test_org");

function tokenOf(link: string): string {
  return new URL(link).searchParams.get("token") || "";
}

describe.skipIf(!hasDb)("org invitations (integration)", () => {
  beforeEach(async () => {
    await wipe();
    setJar(null);
  });
  afterAll(closeDb);

  async function superToken() {
    const { token } = await makeSuperadmin(`super-${Date.now()}-${Math.random()}@t.co`);
    setJar(token);
    return token;
  }

  const orgBody = (adminEmail: string, name = "Acme") => ({
    name,
    email: `${name.toLowerCase().replace(/[^a-z]/g, "")}@t.co`,
    adminFirstName: "Org",
    adminLastName: "Admin",
    adminEmail,
  });

  it("creates org + admin + invitation and returns a setup link when email is off", async () => {
    await superToken();
    const r = await createOrg(
      req("/api/super-admin/organizations", { method: "POST", body: orgBody("boss@t.co"), ip: nextIp() })
    );
    expect(r.status).toBe(201);
    const d = (await r.json()) as { ok: boolean; id: string; emailSent: boolean; setupLink?: string };
    expect(d.ok).toBe(true);
    expect(d.emailSent).toBe(false);
    expect(d.setupLink).toMatch(/\/accept-invitation\?token=[A-Za-z0-9]+/);
    expect(await Organization.countDocuments()).toBe(1);
    const admin = await User.findOne({ email: "boss@t.co" }).lean();
    expect(admin).toBeTruthy();
    expect((admin as unknown as { status: string }).status).toBe("PENDING");
    expect(await Invitation.countDocuments({ email: "boss@t.co" })).toBe(1);
  });

  it("rejects a duplicate admin email without creating a second org", async () => {
    await superToken();
    const ip = nextIp();
    const first = await createOrg(
      req("/api/super-admin/organizations", { method: "POST", body: orgBody("boss@t.co", "Acme"), ip })
    );
    expect(first.status).toBe(201);
    const retry = await createOrg(
      req("/api/super-admin/organizations", { method: "POST", body: orgBody("boss@t.co", "Other"), ip: nextIp() })
    );
    expect(retry.status).toBe(409);
    expect(await Organization.countDocuments()).toBe(1);
  });

  it("rotates the invitation on resend and kills the old link", async () => {
    await superToken();
    const created = (await (
      await createOrg(
        req("/api/super-admin/organizations", { method: "POST", body: orgBody("boss@t.co"), ip: nextIp() })
      )
    ).json()) as { id: string; setupLink: string };
    const oldToken = tokenOf(created.setupLink);

    const r = await resendOrg(
      req(`/api/super-admin/organizations/${created.id}/resend`, { method: "POST", ip: nextIp() }),
      { params: { id: created.id } }
    );
    expect(r.status).toBe(200);
    const d = (await r.json()) as { ok: boolean; emailSent: boolean; setupLink: string };
    expect(d.ok).toBe(true);
    const newToken = tokenOf(d.setupLink);
    expect(newToken).not.toBe(oldToken);

    const deadRes = await acceptGet(req(`/api/auth/accept-invitation?token=${oldToken}`, { ip: nextIp() }));
    expect(deadRes.status).toBe(400);
    const live = await acceptGet(req(`/api/auth/accept-invitation?token=${newToken}`, { ip: nextIp() }));
    expect(live.status).toBe(200);
  });

  it("accept activates the admin once, then login routes to the dashboard", async () => {
    await superToken();
    const created = (await (
      await createOrg(
        req("/api/super-admin/organizations", { method: "POST", body: orgBody("boss@t.co"), ip: nextIp() })
      )
    ).json()) as { setupLink: string };
    const token = tokenOf(created.setupLink);

    const weak = await acceptPost(
      req("/api/auth/accept-invitation", {
        method: "POST",
        body: { token, password: "weakpass" },
        ip: nextIp(),
      })
    );
    expect(weak.status).toBe(400);

    const ok = await acceptPost(
      req("/api/auth/accept-invitation", {
        method: "POST",
        body: { token, password: "Strong1Pass" },
        ip: nextIp(),
      })
    );
    expect(ok.status).toBe(200);

    const reuse = await acceptPost(
      req("/api/auth/accept-invitation", {
        method: "POST",
        body: { token, password: "Strong1Pass" },
        ip: nextIp(),
      })
    );
    expect(reuse.status).toBe(400);

    const lr = await login(
      req("/api/auth/login", {
        method: "POST",
        body: { email: "boss@t.co", password: "Strong1Pass" },
        ip: nextIp(),
      })
    );
    const ld = (await lr.json()) as { ok: boolean; redirectTo: string };
    expect(ld.ok).toBe(true);
    expect(ld.redirectTo).toBe("/dashboard");
  });

  it("forbids org creation for non-super-admins", async () => {
    const { token } = await makeOrgWithAdmin();
    setJar(token);
    const r = await createOrg(
      req("/api/super-admin/organizations", { method: "POST", body: orgBody("x@t.co"), ip: nextIp() })
    );
    expect(r.status).toBe(403);
    setJar(null);
    const anon = await createOrg(
      req("/api/super-admin/organizations", { method: "POST", body: orgBody("y@t.co"), ip: nextIp() })
    );
    expect(anon.status).toBe(403);
  });
});
