import { describe, it, expect } from "vitest";
import { decideClockInStatus, decideClockOutStatus, hhmmToMinutes } from "../lib/attendance/rules";

describe("attendance rules", () => {
  const rules = { workStart: "08:00", workEnd: "17:00", graceMinutes: 15 };
  const tz = "Africa/Accra";
  // Build dates in UTC that correspond to org-local times (Accra = UTC+0, so same).
  const at = (h: number, m: number) => new Date(Date.UTC(2026, 9, 5, h, m, 0));

  it("marks on-time clock-in as PRESENT", () => {
    expect(decideClockInStatus(at(8, 13), tz, rules)).toBe("PRESENT");
  });
  it("marks late clock-in as LATE", () => {
    expect(decideClockInStatus(at(8, 21), tz, rules)).toBe("LATE");
  });
  it("computes clock-out duration and early leave", () => {
    const r = decideClockOutStatus(at(7, 55), at(16, 30), tz, rules);
    expect(r.status).toBe("EARLY_LEAVE");
    expect(r.totalMinutes).toBe(8 * 60 + 35);
  });
  it("hhmm parses", () => {
    expect(hhmmToMinutes("08:00")).toBe(480);
  });
});
