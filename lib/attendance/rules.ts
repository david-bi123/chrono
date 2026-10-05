import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";

export const DEFAULT_TIMEZONE = "Africa/Accra";

export function orgTodayKey(now: Date, timezone: string): string {
  return formatInTimeZone(now, timezone, "yyyy-MM-dd");
}

export function orgNowParts(now: Date, timezone: string) {
  return {
    dateKey: formatInTimeZone(now, timezone, "yyyy-MM-dd"),
    displayDate: formatInTimeZone(now, timezone, "EEEE, MMMM d, yyyy"),
    displayTime: formatInTimeZone(now, timezone, "hh:mm a"),
    weekday: Number(formatInTimeZone(now, timezone, "i")) % 7, // 0=Sunday..6=Saturday
  };
}

/** "08:00" -> minutes since midnight */
export function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** minutes since midnight of `now` in the org timezone */
export function orgMinutesSinceMidnight(now: Date, timezone: string): number {
  const zoned = toZonedTime(now, timezone);
  return zoned.getHours() * 60 + zoned.getMinutes();
}

export type AttendanceStatus =
  | "PRESENT"
  | "LATE"
  | "EARLY_LEAVE"
  | "HALF_DAY"
  | "INCOMPLETE"
  | "ON_LEAVE";

export interface AttendanceRuleInput {
  workStart: string;
  workEnd: string;
  graceMinutes: number;
}

export function decideClockInStatus(clockInAt: Date, timezone: string, rules: AttendanceRuleInput): AttendanceStatus {
  const mins = orgMinutesSinceMidnight(clockInAt, timezone);
  const start = hhmmToMinutes(rules.workStart);
  return mins <= start + rules.graceMinutes ? "PRESENT" : "LATE";
}

export function decideClockOutStatus(
  clockInAt: Date,
  clockOutAt: Date,
  timezone: string,
  rules: AttendanceRuleInput
): { status: AttendanceStatus; totalMinutes: number } {
  const totalMinutes = Math.max(0, Math.round((clockOutAt.getTime() - clockInAt.getTime()) / 60000));
  const inStatus = decideClockInStatus(clockInAt, timezone, rules);
  const outMins = orgMinutesSinceMidnight(clockOutAt, timezone);
  const end = hhmmToMinutes(rules.workEnd);
  const earlyThreshold = end - 15;
  const early = outMins < earlyThreshold;
  const late = inStatus === "LATE";
  let status: AttendanceStatus = "PRESENT";
  if (late && early) status = totalMinutes < 240 ? "HALF_DAY" : "LATE";
  else if (late) status = "LATE";
  else if (early) status = totalMinutes < 240 ? "HALF_DAY" : "EARLY_LEAVE";
  return { status, totalMinutes };
}

export function formatInOrgTz(d: Date | string | null | undefined, timezone: string, fmt = "hh:mm a"): string {
  if (!d) return "—";
  return formatInTimeZone(new Date(d), timezone, fmt);
}

// Re-export for convenience
export { fromZonedTime };
