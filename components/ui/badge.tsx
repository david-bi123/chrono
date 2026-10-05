import { cn } from "@/lib/utils";

type Tone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "violet"
  | "brand"
  | "working";

const tones: Record<Tone, string> = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  warning: "bg-amber-50 text-amber-800 ring-amber-600/25",
  danger: "bg-red-50 text-red-700 ring-red-600/20",
  info: "bg-sky-50 text-sky-700 ring-sky-600/20",
  neutral: "bg-neutral-100 text-neutral-600 ring-neutral-500/20",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/20",
  brand: "bg-brand-50 text-brand-700 ring-brand-600/20",
  working: "bg-blue-50 text-blue-700 ring-blue-600/20",
};

const dots: Record<Tone, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-sky-500",
  neutral: "bg-neutral-400",
  violet: "bg-violet-500",
  brand: "bg-brand-500",
  working: "bg-blue-500",
};

const STATUS_TONE: Record<string, Tone> = {
  PRESENT: "success",
  ACTIVE: "success",
  APPROVED: "success",
  LATE: "warning",
  PENDING: "warning",
  EARLY_LEAVE: "warning",
  HALF_DAY: "violet",
  ON_LEAVE: "info",
  INCOMPLETE: "neutral",
  DISABLED: "neutral",
  ABSENT: "danger",
  SUSPENDED: "danger",
  REVOKED: "danger",
  REJECTED: "danger",
  WORKING: "working",
};

export function statusTone(value: string): Tone {
  return STATUS_TONE[value] ?? "neutral";
}

export function statusLabel(value: string): string {
  if (value === "WORKING") return "Working";
  return value.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export function StatusBadge({
  value,
  className,
  size = "md",
  pulse,
}: {
  value: string;
  className?: string;
  size?: "sm" | "md";
  pulse?: boolean;
}) {
  const tone = statusTone(value);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-medium ring-1 ring-inset",
        size === "sm" ? "px-2 py-0.5 text-[10.5px]" : "px-2.5 py-1 text-[11.5px]",
        tones[tone],
        className
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {pulse && (
          <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", dots[tone])} />
        )}
        <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", dots[tone])} />
      </span>
      {statusLabel(value)}
    </span>
  );
}

/** Backwards-compatible alias used across the app. */
export function Badge({ value, className }: { value: string; className?: string }) {
  return <StatusBadge value={value} className={className} />;
}
