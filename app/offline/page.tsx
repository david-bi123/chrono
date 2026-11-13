import type { Metadata } from "next";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: "You're offline",
  robots: { index: false, follow: false },
};

/**
 * Cached by the service worker so an offline navigation lands on something
 * branded instead of the browser's error page. Deliberately static: no data,
 * no session, nothing to leak on a shared device.
 */
export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-6 text-center">
      <Logo />
      <h1 className="mt-8 font-display text-2xl font-bold tracking-[-0.02em] text-neutral-900">
        You&apos;re offline
      </h1>
      <p className="mt-2 max-w-sm text-[14.5px] leading-relaxed text-neutral-600">
        ChronoSwift needs a connection to load attendance. Check your network, then try again — nothing was saved
        while you were offline.
      </p>
      <a
        href="/start"
        className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-brand-600 px-4 text-[14px] font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
      >
        Try again
      </a>
    </main>
  );
}
