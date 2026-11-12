"use client";

import { useEffect, useState } from "react";

/** Ghana has a single timezone and no daylight saving, so one constant is enough. */
export const ACCRA_TIME_ZONE = "Africa/Accra";

export type ClockParts = { hours: number; minutes: number; seconds: number };

const partsFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: ACCRA_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

const pad = (value: number) => String(value).padStart(2, "0");

/** Wall-clock parts in Accra, independent of the visitor's own timezone. */
export function accraClockParts(date: Date): ClockParts {
  const parts = partsFormatter.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return { hours: read("hour"), minutes: read("minute"), seconds: read("second") };
}

/** `14:07` — the minute-level time people actually read. */
export function formatAccraTime(date: Date): string {
  const { hours, minutes } = accraClockParts(date);
  return `${pad(hours)}:${pad(minutes)}`;
}

/**
 * Current instant, refreshed on an interval. Starts as `null` so the server and
 * the first client render agree; callers show a placeholder until it resolves.
 */
export function useAccraClock(intervalMs = 1000): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}
