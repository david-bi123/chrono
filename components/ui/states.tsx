import type { LucideIcon } from "lucide-react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className ?? "h-4 w-full")} />;
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent", className)}
      aria-hidden
    />
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white">
      <div className="h-10 w-full border-b border-neutral-100 bg-neutral-50/60" />
      <div className="divide-y divide-neutral-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <div className="skeleton h-8 w-8 rounded-full" style={{ opacity: 1 - i * 0.1 }} />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3 w-40" style={{ opacity: 1 - i * 0.1 }} />
              <div className="skeleton h-3 w-24" style={{ opacity: 1 - i * 0.12 }} />
            </div>
            <div className="skeleton hidden h-5 w-20 rounded-full sm:block" style={{ opacity: 1 - i * 0.1 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-neutral-200/80 bg-white p-5", className)}>
      <div className="skeleton h-3.5 w-32" />
      <div className="skeleton mt-4 h-8 w-20" />
      <div className="skeleton mt-3 h-3 w-40" />
    </div>
  );
}

export function KpiSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-5">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-9 w-full" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-14 text-center",
        className
      )}
    >
      {Icon && (
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-500">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
      )}
      <div className="text-[15px] font-semibold tracking-[-0.01em] text-neutral-900">{title}</div>
      <p className="mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-neutral-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  className,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50/60 px-6 py-12 text-center",
        className
      )}
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <div className="text-sm font-semibold text-red-900">{title}</div>
      <p className="mx-auto mt-1 max-w-sm text-[13px] leading-relaxed text-red-700">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-xs transition hover:bg-red-50"
        >
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
      )}
    </div>
  );
}
