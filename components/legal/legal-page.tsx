import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";

/**
 * Shared shell for /terms and /privacy. Plain-prose documents are rendered as
 * structured sections so headings, spacing and type stay consistent.
 */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-neutral-200/70 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="ChronoSwift home" className="flex items-center">
            <Logo size="sm" />
          </Link>
          <p className="text-[12.5px] text-neutral-500">Last updated: {updated}</p>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
        <h1 className="font-display text-balance text-3xl font-bold tracking-[-0.02em] text-neutral-900 sm:text-4xl">{title}</h1>
        <div className="mt-8">{children}</div>
      </main>
      <footer className="border-t border-neutral-200/70 bg-white">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 px-4 py-6 text-[13px] sm:px-6">
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-medium" aria-label="Footer">
            <Link href="/terms" className="text-neutral-500 transition hover:text-neutral-900">Terms of Service</Link>
            <Link href="/privacy" className="text-neutral-500 transition hover:text-neutral-900">Privacy Policy</Link>
            <Link href="/" className="text-neutral-500 transition hover:text-neutral-900">Home</Link>
          </nav>
          <p className="text-neutral-400">
            Created by{" "}
            <a
              href="https://samtechlabs.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-4 transition hover:text-brand-600 hover:decoration-brand-500"
            >
              SamTech Labs
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-9 first:mt-0">
      <h2 className="font-display text-[17px] font-semibold tracking-tight text-neutral-900">{title}</h2>
      <div className="mt-2.5 space-y-3 text-[14.5px] leading-relaxed text-neutral-600">{children}</div>
    </section>
  );
}

export function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5" aria-label={undefined}>
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}
