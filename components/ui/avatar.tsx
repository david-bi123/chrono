import { cn } from "@/lib/utils";

const PALETTES = [
  "bg-brand-100 text-brand-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-rose-100 text-rose-700",
  "bg-neutral-200 text-neutral-700",
];

function hash(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

export function Avatar({
  name,
  email,
  size = "md",
  className,
}: {
  name?: string;
  email?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const seed = (email || name || "?").trim();
  const parts = (name || email || "?").trim().split(/[\s@._-]+/).filter(Boolean);
  const initials = (
    (parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "")
  ).toUpperCase();

  const sizes = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-[11px]",
    md: "h-9 w-9 text-xs",
    lg: "h-12 w-12 text-[15px]",
    xl: "h-20 w-20 text-2xl",
  } as const;

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold tracking-tight",
        sizes[size],
        PALETTES[hash(seed) % PALETTES.length],
        className
      )}
    >
      {initials}
    </span>
  );
}
