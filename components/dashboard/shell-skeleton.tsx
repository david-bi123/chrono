import { Skeleton } from "@/components/ui/states";

/**
 * Instant paint for route transitions. Next.js renders this the moment a
 * navigation starts and swaps in the real page when its Server Component
 * (session + database lookups) resolves — so the app never sits on a frozen
 * page while data loads. Mirrors the AppShell layout (sidebar / topbar /
 * content / mobile bottom nav) without needing any data.
 */
export function ShellSkeleton() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar (desktop) */}
      <aside
        className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-neutral-200/80 bg-white md:flex"
        aria-hidden
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-neutral-100 px-5">
          <Skeleton className="h-8 w-8 rounded-[9px]" />
          <Skeleton className="h-4 w-24 rounded-md" />
        </div>
        <div className="flex-1 space-y-6 overflow-hidden px-3 py-4">
          {[0, 1].map((group) => (
            <div key={group} className="space-y-1">
              <Skeleton className="mx-3 mb-2 h-2.5 w-16 rounded" />
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2">
                  <Skeleton className="h-[18px] w-[18px] rounded-md" />
                  <Skeleton className="h-3.5 flex-1 rounded-md" />
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2.5 border-t border-neutral-100 p-4">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-2.5 w-16 rounded" />
          </div>
        </div>
      </aside>

      {/* Content column */}
      <div className="flex min-w-0 flex-1 flex-col" aria-hidden>
        <div className="border-b border-neutral-200/70 bg-white/85">
          <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Skeleton className="h-9 w-9 rounded-lg md:hidden" />
            <div className="hidden min-w-0 items-center gap-2 md:flex">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-3.5 w-24 rounded-md" />
              <Skeleton className="h-3.5 w-3 rounded-md" />
              <Skeleton className="h-3.5 w-28 rounded-md" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight md:hidden">ChronoSwift</span>
            <div className="ml-auto flex items-center gap-2.5">
              <Skeleton className="hidden h-8 w-36 rounded-lg lg:block" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[1280px] flex-1 px-4 pb-24 pt-6 sm:px-6 sm:pt-7 lg:px-8 md:pb-12">
          <div className="space-y-2.5">
            <Skeleton className="h-7 w-56 rounded-lg" />
            <Skeleton className="h-4 w-72 rounded-md" />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-xs">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="mt-2.5 h-7 w-14 rounded-md" />
                <Skeleton className="mt-2 h-2.5 w-24 rounded" />
              </div>
            ))}
          </div>
          <Skeleton className="mt-4 h-64 w-full rounded-xl" />
        </div>

        {/* Mobile bottom nav */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200/80 bg-white/95 md:hidden">
          <div className="mx-auto grid max-w-lg auto-cols-fr grid-flow-col px-2 py-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 py-1.5">
                <Skeleton className="h-5 w-5 rounded-md" />
                <Skeleton className="h-2 w-10 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <span className="sr-only" role="status">
        Loading…
      </span>
    </div>
  );
}
