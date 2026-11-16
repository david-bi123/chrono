import { describe, it, expect } from "vitest";
import { startPathFor } from "../lib/auth/start-target";

// The installed app launches on /start. Each role has its own shell, so the
// launcher has to resolve rather than assume: a fixed /dashboard would send
// staff to /unauthorized the moment they opened the app.
describe("installed-app launch target", () => {
  it("sends a signed-out launch through sign-in and back to /start", () => {
    expect(startPathFor(null)).toBe("/login?next=%2Fstart");
  });

  it("routes each role to its own home", () => {
    expect(startPathFor({ sub: "u1", orgId: null, role: "SUPER_ADMIN" })).toBe("/super-admin");
    expect(startPathFor({ sub: "u2", orgId: "o1", role: "ORGANIZATION_ADMIN" })).toBe("/dashboard");
    expect(startPathFor({ sub: "u3", orgId: "o1", role: "MANAGER" })).toBe("/dashboard");
    expect(startPathFor({ sub: "u4", orgId: "o1", role: "STAFF" })).toBe("/staff");
  });
});
