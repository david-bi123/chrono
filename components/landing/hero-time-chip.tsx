"use client";

import { formatAccraTime, useAccraClock } from "@/components/time/accra-time";

/** Live Accra wall-clock time, pinned to the hero photo. */
export function HeroTimeChip() {
  const now = useAccraClock(5000);

  return (
    <span
      title="Current time in Accra, Ghana"
      className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-ink-950/60 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-brand-300" aria-hidden />
      <span className="tabular">{now ? formatAccraTime(now) : "--:--"}</span>
      <span className="font-medium text-white/55">Accra</span>
    </span>
  );
}
