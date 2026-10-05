import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-14 text-center shadow-soft">
      {Icon && (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="text-[15px] font-semibold tracking-tight text-neutral-900">{title}</div>
      <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-neutral-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className ?? "h-4 w-full")} />;
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-12 w-full" style={{ opacity: 1 - i * 0.12 }} />
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/60 px-6 py-10 text-center">
      <div className="text-sm font-semibold text-red-800">Something went wrong</div>
      <p className="mx-auto mt-1 max-w-sm text-[13px] text-red-600">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
          Try again
        </button>
      )}
    </div>
  );
}
