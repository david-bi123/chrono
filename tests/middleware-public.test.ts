import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { isPublic, middleware } from "../middleware";

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
    // Legal documents must stay reachable without sign-in — staff and the
    // public read them before any account exists.
    expect(isPublic("/terms")).toBe(true);
    expect(isPublic("/privacy")).toBe(true);
  });

  it("keeps the installed-app entry points reachable without a session", async () => {
    // The PWA start_url and the service worker's offline page must work with
    // no session at all; a login redirect here makes the installed app open on
    // /login every launch.
    expect(isPublic("/start")).toBe(true);
    expect(isPublic("/offline")).toBe(true);

    // The worker, manifest and icons are static files that carry a dot, so the
    // middleware lets them through before the session check.
    for (const path of ["/sw.js", "/manifest.webmanifest", "/icons/icon-192.png"]) {
      const res = await middleware(new NextRequest(`http://test.local${path}`));
      expect(res.status).toBe(200);
      expect(res.headers.get("location")).toBeNull();
    }
  });

  it("preserves the query string when bouncing to login", async () => {
    // The scan flow lands on /staff/clock?token=… after sign-in; dropping
    // the query would strand users on a token-less page.
    const res = await middleware(new NextRequest("http://test.local/staff/clock?token=chr_abc123"));
    expect(res.status).toBe(307);
    const location = res.headers.get("location") || "";
    expect(location).toContain("/login");
    expect(location).toContain("next=%2Fstaff%2Fclock%3Ftoken%3Dchr_abc123");
  });
});
