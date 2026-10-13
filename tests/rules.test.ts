import { describe, it, expect } from "vitest";
import {
  decideClockInStatus,
  decideClockOutStatus,
  orgTodayKey,
  orgNowParts,
  formatInOrgTz,
} from "../lib/attendance/rules";

const rules = { workStart: "08:00", workEnd: "17:00", graceMinutes: 15 };
const tz = "Africa/Accra";
// Accra is UTC+0, so UTC inputs map 1:1 to org-local times.
const at = (day: number, h: number, m: number) => new Date(Date.UTC(2026, 9, day, h, m, 0));

describe("attendance rules — boundaries", () => {
  it("treats the last grace minute as on time, the next as late", () => {
    expect(decideClockInStatus(at(5, 8, 15), tz, rules)).toBe("PRESENT");
    expect(decideClockInStatus(at(5, 8, 16), tz, rules)).toBe("LATE");
  });
  it("treats clock-out at end-minus-15 as full day, a minute earlier as early leave", () => {
    const full = decideClockOutStatus(at(5, 7, 55), at(5, 16, 45), tz, rules);
    expect(full.status).toBe("PRESENT");
    const early = decideClockOutStatus(at(5, 7, 55), at(5, 16, 44), tz, rules);
    expect(early.status).toBe("EARLY_LEAVE");
  });
  it("marks short early days as half day", () => {
    const r = decideClockOutStatus(at(5, 12, 0), at(5, 15, 0), tz, rules);
    expect(r.status).toBe("HALF_DAY");
    expect(r.totalMinutes).toBe(180);
  });
  it("keeps late status when a late arrival works a full day", () => {
    const r = decideClockOutStatus(at(5, 9, 0), at(5, 17, 30), tz, rules);
    expect(r.status).toBe("LATE");
    expect(r.totalMinutes).toBe(510);
  });
  it("never reports negative minutes", () => {
    const r = decideClockOutStatus(at(5, 12, 0), at(5, 11, 0), tz, rules);
    expect(r.totalMinutes).toBe(0);
  });
});

describe("attendance rules — dates", () => {
  it("builds date keys in org timezone", () => {
    expect(orgTodayKey(at(5, 0, 30), tz)).toBe("2026-10-05");
  });
  it("exposes weekday with Sunday as 0", () => {
    expect(orgNowParts(at(5, 12, 0), tz).weekday).toBe(1); // Monday
    expect(orgNowParts(at(4, 12, 0), tz).weekday).toBe(0); // Sunday
  });
  it("formats missing times as a dash", () => {
    expect(formatInOrgTz(null, tz)).toBe("—");
    expect(formatInOrgTz(undefined, tz)).toBe("—");
  });
});
