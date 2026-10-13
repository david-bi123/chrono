/**
 * Shared harness for API integration tests.
 *
 * Tests run route handlers directly (no HTTP server) against a real MongoDB:
 *   MONGODB_TEST_URI or mongodb://127.0.0.1:27017/chrono_test
 * Auth is real end-to-end: login via the login route, session JWT carried in
 * a mocked `next/headers` cookie jar. Each test uses a unique fake client IP
 * so the in-memory rate limiter never leaks state between tests.
 */
import mongoose from "mongoose";
import { dbConnect } from "../../lib/db/mongoose";
import "../../models/User";
import "../../models/Organization";
import "../../models/Attendance";
import "../../models/AttendanceLocation";
import "../../models/Invitation";
import "../../models/AuditLog";
import { User } from "../../models/User";
import { Organization } from "../../models/Organization";
import { createSession } from "../../lib/auth/session";
import { hashPassword } from "../../lib/auth/password";
import { hashToken } from "../../lib/auth/tokens";

process.env.AUTH_SECRET =
  process.env.AUTH_SECRET || "test-secret-that-is-long-enough-32-chars";
process.env.APP_URL = process.env.APP_URL || "http://test.local";
process.env.MONGODB_URI =
  process.env.MONGODB_TEST_URI || "mongodb://127.0.0.1:27017/chrono_test";
// Never hit a real mail provider from tests — exercise the skipped path.
delete process.env.MAILJET_API_KEY;
delete process.env.MAILJET_SECRET_KEY;

let dbOk: boolean | null = null;
/**
 * Connect to an isolated test database. Each integration file uses its own
 * database name because vitest runs files in parallel workers sharing the
 * same MongoDB server — a shared DB would let one file's wipe delete
 * another file's fixtures mid-test.
 */
export async function useDb(name: string): Promise<boolean> {
  const server = process.env.MONGODB_TEST_URI || "mongodb://127.0.0.1:27017";
  process.env.MONGODB_URI = `${server}/${name}`;
  if (dbOk !== null) return dbOk;
  try {
    await dbConnect();
    dbOk = true;
  } catch {
    dbOk = false;
  }
  return dbOk;
}

export async function closeDb() {
  await mongoose.disconnect().catch(() => {});
}

/** Wipe all collections for test isolation. */
export async function wipe() {
  const { Attendance } = await import("../../models/Attendance");
  const { AttendanceLocation } = await import("../../models/AttendanceLocation");
  const { Invitation } = await import("../../models/Invitation");
  const { AuditLog } = await import("../../models/AuditLog");
  await Promise.all([
    User.deleteMany({}),
    Organization.deleteMany({}),
    Attendance.deleteMany({}),
    AttendanceLocation.deleteMany({}),
    Invitation.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);
}

let ipSeq = 100;
/** Unique fake client IP per test (rate-limiter isolation). */
export function nextIp() {
  ipSeq = (ipSeq + 1) % 250;
  return `10.9.0.${ipSeq}`;
}

type ReqOpts = {
  method?: string;
  body?: unknown;
  ip?: string;
  cookie?: string;
};

export function req(path: string, opts: ReqOpts = {}): Request {
  const headers: Record<string, string> = {
    "x-forwarded-for": opts.ip || nextIp(),
  };
  if (opts.cookie) headers.cookie = `chrono_session=${opts.cookie}`;
  return new Request(`http://test.local${path}`, {
    method: opts.method || "GET",
    headers: {
      ...headers,
      ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
}

/** Session cookie jar consumed by the mocked next/headers. */
export function setJar(token: string | null) {
  (globalThis as Record<string, unknown>).__jar =
    token == null ? {} : { chrono_session: token };
}

/** Real login through the login route; returns the session JWT. */
export async function loginAs(email: string, password: string, ip?: string): Promise<string> {
  const { POST } = await import("../../app/api/auth/login/route");
  const r = await POST(
    req("/api/auth/login", { method: "POST", body: { email, password }, ip })
  );
  const body = (await r.json()) as { ok?: boolean; error?: string };
  if (!r.ok || !body.ok) throw new Error(`login failed for ${email}: ${body.error}`);
  const setCookies: string[] =
    (r.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.() ?? [];
  const found = setCookies.map(String).find((c) => c.startsWith("chrono_session="));
  if (!found) throw new Error("login set no session cookie");
  return found.split(";")[0].split("=").slice(1).join("=");
}

let pwHash: string | null = null;
/** Shared bcrypt hash for fixture passwords (hash once, reuse). */
export async function fixtureHash(): Promise<string> {
  if (!pwHash) pwHash = await hashPassword("Fixture123!");
  return pwHash;
}

export async function makeSuperadmin(email = "super@t.co") {
  const u = await User.create({
    role: "SUPER_ADMIN",
    firstName: "Super",
    lastName: "Admin",
    email,
    status: "ACTIVE",
  });
  const token = await createSession({ sub: String(u._id), orgId: null, role: "SUPER_ADMIN" });
  return { user: u, token };
}

export async function makeOrgWithAdmin(
  orgName = "TestCo",
  adminEmail = "admin@test.co"
) {
  const org = await Organization.create({
    name: orgName,
    slug: `test-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    email: `org-${Date.now()}@test.co`,
    status: "ACTIVE",
  });
  const admin = await User.create({
    organizationId: org._id,
    role: "ORGANIZATION_ADMIN",
    firstName: "Org",
    lastName: "Admin",
    email: adminEmail,
    passwordHash: await fixtureHash(),
    status: "ACTIVE",
  });
  const token = await createSession({
    sub: String(admin._id),
    orgId: String(org._id),
    role: "ORGANIZATION_ADMIN",
  });
  return { org, admin, token };
}

export async function makeStaff(
  orgId: unknown,
  email = "staff@test.co",
  active = true
) {
  const staff = await User.create({
    organizationId: orgId as never,
    role: "STAFF",
    firstName: "Test",
    lastName: "Staff",
    email,
    employeeId: `E-${email}`,
    passwordHash: active ? await fixtureHash() : undefined,
    status: active ? "ACTIVE" : "PENDING",
  });
  return staff;
}

export async function makeLocation(orgId: unknown, raw: string, name = "Gate") {
  const { AttendanceLocation } = await import("../../models/AttendanceLocation");
  return AttendanceLocation.create({
    organizationId: orgId as never,
    name,
    tokenHash: hashToken(raw),
    status: "ACTIVE",
  });
}
