import { cn } from "@/lib/utils";

type Tone = "ink" | "brand" | "light";

const BG: Record<Tone, string> = {
  ink: "text-neutral-900",
  brand: "text-brand-600",
  light: "text-white",
};

/** Chrono mark — a clock face, signalling time + precision. */
export function LogoMark({
  className,
  tone = "ink",
  square = true,
}: {
  className?: string;
  tone?: Tone;
  /** Render the rounded-square backdrop. Use `false` for a bare glyph (e.g. next to a wordmark). */
  square?: boolean;
}) {
  const stroke = tone === "light" ? "#0B0F19" : "#FFFFFF";
  const dot = tone === "light" ? "#1F4FE0" : tone === "brand" ? "#FFFFFF" : "#6A87FF";
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn(square && "rounded-[9px]", BG[tone], className)}
      role="img"
      aria-label="Chrono"
    >
      {square && <rect width="32" height="32" rx="9" fill="currentColor" />}
      <circle cx="16" cy="16" r="8.25" fill="none" stroke={square ? stroke : "currentColor"} strokeWidth="1.9" />
      <path
        d="M16 10.9V16l3.4 2"
        fill="none"
        stroke={square ? stroke : "currentColor"}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="16" r="1.35" fill={square ? dot : "currentColor"} />
    </svg>
  );
}

export function Logo({
  size = "md",
  className,
  tone = "ink",
  showWordmark = true,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
  tone?: Tone;
  showWordmark?: boolean;
}) {
  const mark = { sm: "h-7 w-7", md: "h-8 w-8", lg: "h-9 w-9" }[size];
  const text = { sm: "text-[14px]", md: "text-[15.5px]", lg: "text-[17px]" }[size];
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={mark} tone={tone} />
      {showWordmark && (
        <span
          className={cn(
            "font-semibold tracking-[-0.02em]",
            text,
            tone === "light" ? "text-white" : "text-neutral-900"
          )}
        >
          Chrono
        </span>
      )}
    </span>
  );
}
