import { cn } from "@/lib/utils";

const dot: Record<string, string> = {
  PRESENT: "bg-emerald-500",
  ACTIVE: "bg-emerald-500",
  LATE: "bg-amber-500",
  PENDING: "bg-amber-500",
  EARLY_LEAVE: "bg-orange-500",
  HALF_DAY: "bg-violet-500",
  INCOMPLETE: "bg-neutral-400",
  DISABLED: "bg-neutral-400",
  ABSENT: "bg-red-500",
  SUSPENDED: "bg-red-500",
  ON_LEAVE: "bg-sky-500",
  REVOKED: "bg-red-500",
};

const wrap: Record<string, string> = {
  PRESENT: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  LATE: "bg-amber-50 text-amber-800 ring-amber-600/25",
  PENDING: "bg-amber-50 text-amber-800 ring-amber-600/25",
  EARLY_LEAVE: "bg-orange-50 text-orange-700 ring-orange-600/20",
  HALF_DAY: "bg-violet-50 text-violet-700 ring-violet-600/20",
  INCOMPLETE: "bg-neutral-100 text-neutral-600 ring-neutral-500/20",
  DISABLED: "bg-neutral-100 text-neutral-600 ring-neutral-500/20",
  ABSENT: "bg-red-50 text-red-700 ring-red-600/20",
  SUSPENDED: "bg-red-50 text-red-700 ring-red-600/20",
  ON_LEAVE: "bg-sky-50 text-sky-700 ring-sky-600/20",
  REVOKED: "bg-red-50 text-red-700 ring-red-600/20",
};

export function Badge({ value, className }: { value: string; className?: string }) {
  const label = value.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset",
        wrap[value] ?? "bg-neutral-100 text-neutral-600 ring-neutral-500/20",
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dot[value] ?? "bg-neutral-400")} />
      {label}
    </span>
  );
}
