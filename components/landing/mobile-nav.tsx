"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { InstallAppButton } from "@/components/pwa/install-app-button";

/**
 * Small-screen navigation. The desktop nav is hidden below `lg`, so without
 * this the section links and the sign-in path disappear entirely on phones.
 * Behaves as a disclosure (not a modal): Escape closes it, resizing up closes
 * it, and focus returns to the trigger.
 */
export function MobileNav({
  links,
  requestHref,
}: {
  links: { href: string; label: string }[];
  requestHref: string;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    function onResize() {
      if (window.innerWidth >= 1024) setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-card text-neutral-700 transition hover:border-neutral-300 hover:text-neutral-900 active:scale-[0.98]"
      >
        {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
      </button>

      <div
        id="mobile-nav"
        hidden={!open}
        className="absolute inset-x-0 top-16 border-b border-neutral-200 bg-background shadow-lift"
      >
        <nav aria-label="Mobile" className="mx-auto max-w-6xl px-4 pb-5 pt-3 sm:px-6">
          <ul className="divide-y divide-neutral-200/70">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between py-3.5 text-[15px] font-medium text-neutral-700 transition hover:text-brand-700"
                >
                  {link.label}
                  <ArrowRight className="h-4 w-4 text-neutral-300" aria-hidden />
                </a>
              </li>
            ))}
            <li>
              <InstallAppButton variant="menu" label="Install the app" onAction={() => setOpen(false)} />
            </li>
            <li>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between py-3.5 text-[15px] font-medium text-neutral-700 transition hover:text-brand-700"
              >
                Sign in
                <ArrowRight className="h-4 w-4 text-neutral-300" aria-hidden />
              </Link>
            </li>
          </ul>
          <a
            href={requestHref}
            onClick={() => setOpen(false)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 active:scale-[0.99]"
          >
            Request a workspace
            <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
        </nav>
      </div>
    </div>
  );
}
