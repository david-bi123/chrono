"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { Check, LayoutDashboard, QrCode, ShieldCheck, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardPreview, PhoneClockPreview, QrLocationsPreview } from "@/components/landing/product-preview";

type TabId = "overview" | "qr" | "clock";

const TABS: Array<{
  id: TabId;
  label: string;
  short: string;
  icon: typeof LayoutDashboard;
  title: string;
  description: string;
  points: string[];
}> = [
  {
    id: "overview",
    label: "Admin overview",
    short: "Overview",
    icon: LayoutDashboard,
    title: "The screen your admin leaves open",
    description:
      "Today's attendance rate, who is still on the clock, and every clock-in as it lands — no refresh, no spreadsheets.",
    points: [
      "Present, late and absent counts from real records",
      "A live working indicator until each person clocks out",
      "Corrections require a reason and are written to the audit trail",
    ],
  },
  {
    id: "qr",
    label: "QR locations",
    short: "QR codes",
    icon: QrCode,
    title: "One code per entrance, independently revocable",
    description:
      "Create a location, print its branded sheet, and rotate the code whenever a printout or photo goes astray.",
    points: [
      "Codes are shown once and stored only as a hash",
      "Regenerating kills every old print and photo instantly",
      "Revoke a location without touching any other code",
    ],
  },
  {
    id: "clock",
    label: "Staff clock-in",
    short: "Clock-in",
    icon: Smartphone,
    title: "Two taps, no app install",
    description:
      "Staff scan with the phone camera they already have, sign in once, and tap Clock In. The server writes the time.",
    points: [
      "Works in any phone or tablet browser",
      "Timestamps come from the server, never the phone clock",
      "One clock-in per person per day, enforced in the database",
    ],
  },
];

export function ProductTour() {
  const [active, setActive] = useState<TabId>("overview");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const selected = TABS.find((tab) => tab.id === active) ?? TABS[0];

  function focusTab(index: number) {
    const next = TABS[(index + TABS.length) % TABS.length];
    setActive(next.id);
    tabRefs.current[(index + TABS.length) % TABS.length]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = TABS.findIndex((tab) => tab.id === active);
    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusTab(index + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusTab(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusTab(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusTab(TABS.length - 1);
    }
  }

  return (
    <div>
      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Product screens"
        onKeyDown={onKeyDown}
        className="mx-auto flex w-full max-w-2xl gap-1.5 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.04] p-1.5 backdrop-blur-sm sm:justify-center"
      >
        {TABS.map((tab, index) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              role="tab"
              id={`tour-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`tour-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActive(tab.id)}
              className={cn(
                "inline-flex flex-1 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 sm:flex-none sm:px-5",
                isActive
                  ? "bg-white text-ink-950 shadow-sm"
                  : "text-neutral-300 hover:bg-white/10 hover:text-white"
              )}
            >
              <tab.icon className={cn("h-4 w-4", isActive ? "text-brand-600" : "text-neutral-400")} aria-hidden />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.short}</span>
            </button>
          );
        })}
      </div>

      {/* Panel */}
      <div
        key={active}
        role="tabpanel"
        id={`tour-panel-${active}`}
        aria-labelledby={`tour-tab-${active}`}
        tabIndex={0}
        className="animate-fade-up mt-8 grid items-center gap-8 outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-4 focus-visible:ring-offset-ink-950 lg:mt-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-12"
      >
        <div>
          <h3 className="font-display text-xl font-bold tracking-[-0.02em] text-white sm:text-2xl">
            {selected.title}
          </h3>
          <p className="mt-2.5 text-sm leading-relaxed text-neutral-400">{selected.description}</p>
          <ul className="mt-5 space-y-2.5">
            {selected.points.map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-neutral-300">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-400/15 text-brand-300">
                  <Check className="h-3 w-3" aria-hidden />
                </span>
                {point}
              </li>
            ))}
          </ul>
          <p className="mt-5 inline-flex items-center gap-1.5 text-[11.5px] font-medium text-neutral-400">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            Sample data shown — the interface is the real thing.
          </p>
        </div>

        <div className="min-w-0">
          {active === "overview" && <DashboardPreview />}

          {active === "qr" && (
            <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.03] p-3 shadow-2xl shadow-black/40 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-white">
                  <QrCode className="h-4 w-4 text-brand-300" aria-hidden />
                  Locations
                </div>
                <span className="rounded-md bg-brand-400 px-2 py-1 text-[10px] font-bold text-brand-950">
                  + New location
                </span>
              </div>
              <QrLocationsPreview />
            </div>
          )}

          {active === "clock" && (
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.02] px-4 py-8 sm:py-10">
              <div
                className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle_at_50%_20%,rgba(116,172,145,0.22),transparent_60%)]"
                aria-hidden
              />
              <div className="relative flex flex-col items-center">
                <PhoneClockPreview />
                <div className="mt-6 flex items-center gap-2 rounded-full border border-brand-400/25 bg-ink-950/70 px-3.5 py-2 text-[11.5px] font-semibold text-brand-200 shadow-lg backdrop-blur-sm">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-400 text-brand-950">
                    <Check className="h-3 w-3" aria-hidden />
                  </span>
                  Clocked in · 07:58 · server-recorded
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
