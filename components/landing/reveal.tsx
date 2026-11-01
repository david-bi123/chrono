"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Scroll reveal for landing sections. Content is visible by default (no-JS
 * safe); elements start hidden only when they sit below the fold at mount,
 * then release on first intersection. Honours prefers-reduced-motion.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  /** Stagger offset in ms (used per-card, e.g. i * 90). */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const belowFold = el.getBoundingClientRect().top > window.innerHeight * 0.92;
    if (!belowFold) return;

    el.classList.add("is-hidden");
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.classList.remove("is-hidden");
          obs.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
