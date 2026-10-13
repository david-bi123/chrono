import { describe, it, expect } from "vitest";
import {
  passwordSchema,
  timezoneSchema,
  correctionSchema,
  inviteStaffSchema,
  createOrgSchema,
  setupAccountSchema,
} from "../lib/validation/schemas";

describe("passwordSchema", () => {
  it("accepts strong passwords", () => {
    expect(passwordSchema.safeParse("Admin123!").success).toBe(true);
    expect(passwordSchema.safeParse("aB3defgh").success).toBe(true);
  });
  it("rejects weak passwords with helpful messages", () => {
    expect(passwordSchema.safeParse("short1A").success).toBe(false);
    expect(passwordSchema.safeParse("alllowercase1").success).toBe(false);
    expect(passwordSchema.safeParse("ALLUPPER1").success).toBe(false);
    expect(passwordSchema.safeParse("NoNumbersHere").success).toBe(false);
    const r = passwordSchema.safeParse("weak");
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.message).toMatch(/8 characters/);
  });
});

describe("timezoneSchema", () => {
  it("accepts real IANA zones", () => {
    for (const tz of ["Africa/Accra", "UTC", "Europe/London", "America/New_York"]) {
      expect(timezoneSchema.safeParse(tz).success).toBe(true);
    }
  });
  it("rejects unknown zones (these used to 500 the whole org)", () => {
    expect(timezoneSchema.safeParse("Mars/Olympus").success).toBe(false);
    expect(timezoneSchema.safeParse("GMT+99").success).toBe(false);
    expect(timezoneSchema.safeParse("").success).toBe(false);
  });
});

describe("correctionSchema", () => {
  const good = { clockIn: "2026-10-05T08:00", reason: "Forgot to clock out" };
  it("accepts valid corrections", () => {
    expect(correctionSchema.safeParse(good).success).toBe(true);
    expect(
      correctionSchema.safeParse({ ...good, clockOut: "2026-10-05T17:00" }).success
    ).toBe(true);
  });
  it("rejects garbage dates that used to poison records", () => {
    expect(correctionSchema.safeParse({ ...good, clockIn: "not-a-date" }).success).toBe(false);
    expect(correctionSchema.safeParse({ ...good, clockOut: "yesterday-ish" }).success).toBe(false);
    expect(correctionSchema.safeParse({ clockIn: "", reason: "long enough reason" }).success).toBe(false);
  });
  it("still requires a written reason", () => {
    expect(correctionSchema.safeParse({ clockIn: "2026-10-05T08:00", reason: "abc" }).success).toBe(false);
  });
});

describe("invite + org + setup schemas", () => {
  it("inviteStaffSchema validates emails and ids", () => {
    expect(
      inviteStaffSchema.safeParse({ firstName: "A", lastName: "B", email: "a@b.co", employeeId: "E-1" }).success
    ).toBe(true);
    expect(
      inviteStaffSchema.safeParse({ firstName: "A", lastName: "B", email: "nope", employeeId: "E-1" }).success
    ).toBe(false);
  });
  it("createOrgSchema requires org + admin fields", () => {
    const good = {
      name: "Acme",
      email: "hi@acme.co",
      adminFirstName: "A",
      adminLastName: "B",
      adminEmail: "a@acme.co",
    };
    expect(createOrgSchema.safeParse(good).success).toBe(true);
    expect(createOrgSchema.safeParse({ ...good, status: "ACTIVE" }).success).toBe(true);
    expect(createOrgSchema.safeParse({ ...good, adminEmail: "bad" }).success).toBe(false);
  });
  it("setupAccountSchema enforces the password policy", () => {
    expect(setupAccountSchema.safeParse({ token: "0123456789abcdef", password: "Weakpass" }).success).toBe(false);
    expect(setupAccountSchema.safeParse({ token: "0123456789abcdef", password: "Strong1Pass" }).success).toBe(true);
    expect(setupAccountSchema.safeParse({ token: "short", password: "Strong1Pass" }).success).toBe(false);
  });
});
