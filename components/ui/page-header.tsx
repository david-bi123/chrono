import * as React from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="min-w-0">
        {breadcrumb && <div className="mb-2 text-[12.5px] font-medium text-neutral-500">{breadcrumb}</div>}
        <h1 className="text-xl font-semibold tracking-[-0.02em] text-neutral-900 sm:text-2xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-neutral-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}

export function SectionHeader({
  title,
  description,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-neutral-900">{title}</h2>
        {description && <p className="mt-1 text-[13px] leading-relaxed text-neutral-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Consistent toolbar for search + filters. */
export function FilterBar({
  children,
  className,
  right,
}: {
  children: React.ReactNode;
  className?: string;
  right?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-neutral-200/80 bg-white p-3.5 shadow-card lg:flex-row lg:items-center",
        className
      )}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2.5">{children}</div>
      {right && <div className="flex items-center gap-2.5">{right}</div>}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
  onKeyDown,
  label = "Search",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  label?: string;
}) {
  return (
    <div className={cn("relative w-full sm:w-64", className)}>
      <svg
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.2-3.2" />
      </svg>
      <input
        type="search"
        aria-label={label}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        className={cn(
          "h-9 w-full rounded-lg border border-neutral-300 bg-white pl-9 pr-3.5 text-sm text-neutral-900 shadow-xs outline-none transition-colors placeholder:text-neutral-500 hover:border-neutral-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-600/10",
          "[&::-webkit-search-cancel-button]:cursor-pointer"
        )}
      />
    </div>
  );
}
