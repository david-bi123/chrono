"use client";

import { accraClockParts, formatAccraTime, useAccraClock } from "@/components/time/accra-time";
import { cn } from "@/lib/utils";

const FACE = "#FBF8F2";
const INK = "#12251C";

/**
 * A drawn analog clock used as a decorative anchor on the auth pages.
 *
 * The hands and the digital readout track the live wall-clock time in Accra,
 * Ghana — the platform's default organization timezone. Purely decorative, so
 * the whole card is aria-hidden.
 */
export function ClockCard({ className }: { className?: string }) {
  const now = useAccraClock(1000);
  const parts = now ? accraClockParts(now) : null;
  const angles = parts
    ? {
        hour: (parts.hours % 12) * 30 + parts.minutes * 0.5,
        minute: parts.minutes * 6 + parts.seconds * 0.1,
        second: parts.seconds * 6,
      }
    : null;

  return (
    <div
      aria-hidden
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-brand-950/10 bg-[#F4EFE6] p-3 shadow-[0_18px_40px_-24px_rgba(18,37,28,0.55)]",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(255,255,255,0.7),transparent_70%)]"
        aria-hidden
      />
      <svg viewBox="0 0 120 120" className="relative h-auto w-[86px] sm:w-[98px] lg:w-[104px]">
        <circle cx="60" cy="60" r="56" fill={FACE} stroke={INK} strokeWidth="2.5" />
        <circle cx="60" cy="60" r="50" fill="none" stroke={INK} strokeOpacity="0.12" strokeWidth="1" />

        {Array.from({ length: 12 }).map((_, index) => (
          <line
            key={index}
            x1="60"
            y1="12"
            x2="60"
            y2={index % 3 === 0 ? "19" : "16"}
            stroke={INK}
            strokeWidth={index % 3 === 0 ? 2.5 : 1.25}
            strokeOpacity={index % 3 === 0 ? 0.85 : 0.4}
            strokeLinecap="round"
            transform={`rotate(${index * 30} 60 60)`}
          />
        ))}

        {angles && (
          <>
            {/* Hour hand */}
            <line
              x1="60"
              y1="60"
              x2="60"
              y2="36"
              stroke={INK}
              strokeWidth="4"
              strokeLinecap="round"
              transform={`rotate(${angles.hour} 60 60)`}
            />
            {/* Minute hand */}
            <line
              x1="60"
              y1="60"
              x2="60"
              y2="22"
              stroke={INK}
              strokeWidth="2.75"
              strokeLinecap="round"
              transform={`rotate(${angles.minute} 60 60)`}
            />
            {/* Second hand, brand green */}
            <line
              x1="60"
              y1="66"
              x2="60"
              y2="16"
              stroke="#4D8F6F"
              strokeWidth="1.25"
              strokeLinecap="round"
              transform={`rotate(${angles.second} 60 60)`}
            />
          </>
        )}

        <circle cx="60" cy="60" r="3.25" fill={INK} />
        <circle cx="60" cy="60" r="1.25" fill="#F4EFE6" />
      </svg>

      <div className="relative mt-1.5 text-center">
        <div className="text-[8px] font-bold uppercase tracking-[0.16em] text-brand-800/70">Accra time</div>
        <div className="mt-0.5 text-[15px] font-semibold leading-none tracking-[-0.02em] tabular text-brand-950">
          {now ? formatAccraTime(now) : "--:--"}
        </div>
        <div className="mt-0.5 text-[8px] font-medium text-brand-800/60">Africa/Accra</div>
      </div>
    </div>
  );
}
