import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export type StatTone = "brand" | "success" | "warning" | "danger" | "neutral" | "sky" | "violet";

const TONES: Record<StatTone, { chip: string; bar: string; text: string }> = {
  brand: { chip: "bg-brand-50 text-brand-600", bar: "bg-brand-600", text: "text-brand-600" },
  success: { chip: "bg-emerald-50 text-emerald-600", bar: "bg-emerald-500", text: "text-emerald-600" },
  warning: { chip: "bg-amber-50 text-amber-600", bar: "bg-amber-500", text: "text-amber-600" },
  danger: { chip: "bg-red-50 text-red-600", bar: "bg-red-500", text: "text-red-600" },
  neutral: { chip: "bg-neutral-100 text-neutral-600", bar: "bg-neutral-400", text: "text-neutral-600" },
  sky: { chip: "bg-sky-50 text-sky-600", bar: "bg-sky-500", text: "text-sky-600" },
  violet: { chip: "bg-violet-50 text-violet-600", bar: "bg-violet-500", text: "text-violet-600" },
};

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "neutral",
  progress,
  className,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon?: LucideIcon;
  tone?: StatTone;
  /** 0–100 — renders a thin progress bar under the value. */
  progress?: number;
  className?: string;
  hint?: React.ReactNode;
}) {
  const t = TONES[tone];
  return (
    <Card
      className={cn(
        "group relative overflow-hidden p-4 transition-colors duration-200 hover:border-neutral-300 sm:p-5",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[12.5px] font-medium text-neutral-500">{label}</div>
          <div className="mt-1.5 text-[28px] font-semibold leading-none tracking-[-0.03em] tabular text-neutral-900">
            {value}
          </div>
        </div>
        {Icon && (
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105",
              t.chip
            )}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
          </span>
        )}
      </div>

      {typeof progress === "number" && (
        <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100" role="presentation">
          <div
            className={cn("h-full rounded-full transition-[width] duration-500 ease-out", t.bar)}
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      )}

      {(sub || hint) && (
        <div className="mt-2 flex items-center gap-1.5 text-[12.5px] text-neutral-500">
          {hint}
          {sub && <span className="truncate">{sub}</span>}
        </div>
      )}
    </Card>
  );
}

export function StatSkeleton() {
  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white p-4 sm:p-5">
      <div className="skeleton h-3 w-24" />
      <div className="skeleton mt-3 h-7 w-16" />
      <div className="skeleton mt-3 h-3 w-32" />
    </div>
  );
}
