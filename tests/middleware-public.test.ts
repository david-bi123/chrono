import { describe, it, expect } from "vitest";
import { isPublic } from "../middleware";

// Guards the QR scan flow: a logged-out phone must reach the scan page AND
// its data endpoint (the page shows a sign-in prompt itself). A middleware
// redirect to /login would surface as HTML and break fetch().json() callers.
describe("middleware public paths", () => {
  it("lets logged-out QR scans reach the scan page and its API", () => {
    expect(isPublic("/attendance/scan/chr_abc123")).toBe(true);
    expect(isPublic("/api/attendance/scan/chr_abc123")).toBe(true);
    expect(isPublic("/api/attendance/clock")).toBe(true);
  });

  it("keeps dashboards, staff area and other APIs behind auth", () => {
    expect(isPublic("/dashboard")).toBe(false);
    expect(isPublic("/dashboard/qr")).toBe(false);
    expect(isPublic("/staff")).toBe(false);
    expect(isPublic("/super-admin")).toBe(false);
    expect(isPublic("/api/org/overview")).toBe(false);
    expect(isPublic("/api/attendance/clock/extra")).toBe(false);
  });

  it("keeps landing and auth endpoints public", () => {
    expect(isPublic("/")).toBe(true);
    expect(isPublic("/login")).toBe(true);
    expect(isPublic("/api/auth/login")).toBe(true);
  });
});
