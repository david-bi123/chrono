import {
  AlarmClock,
  BarChart3,
  Briefcase,
  CalendarDays,
  Clock3,
  LayoutDashboard,
  Lock,
  QrCode,
  ShieldCheck,
  Users,
  UserX,
  ScanLine,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

/**
 * Static product previews used on the marketing page.
 *
 * These mirror the real dashboard / QR / clock screens so a visitor can see
 * what they are buying. They are illustrations with sample data, not live
 * figures — every wrapper is `aria-hidden` and the page carries a visible
 * "sample data" caption so nothing here can be mistaken for a claim.
 */

const ACTIVITY = [
  { name: "Ama Mensah", department: "Operations", clockIn: "07:52", clockOut: "—", status: "WORKING" },
  { name: "Kwame Boateng", department: "Warehouse", clockIn: "08:23", clockOut: "17:05", status: "LATE" },
  { name: "Samuel Addo", department: "Sales", clockIn: "07:58", clockOut: "17:12", status: "PRESENT" },
] as const;

const KPIS = [
  { label: "Staff", value: "27", icon: Users, tone: "bg-neutral-100 text-neutral-600" },
  { label: "Working", value: "18", icon: Briefcase, tone: "bg-brand-50 text-brand-600" },
  { label: "Late", value: "2", icon: AlarmClock, tone: "bg-amber-50 text-amber-600" },
  { label: "Absent", value: "2", icon: UserX, tone: "bg-red-50 text-red-500" },
] as const;

const RAIL = [LayoutDashboard, Clock3, Users, QrCode, BarChart3] as const;

export function DashboardPreview({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "overflow-hidden rounded-2xl border border-white/10 bg-white text-neutral-900 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.75)]",
        className
      )}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-neutral-200/80 bg-neutral-50 px-3 py-2">
        <span className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-400/80" />
          <span className="h-2 w-2 rounded-full bg-amber-400/80" />
          <span className="h-2 w-2 rounded-full bg-brand-400/80" />
        </span>
        <div className="mx-auto flex min-w-0 items-center gap-1.5 rounded-md bg-white px-2.5 py-1 text-[9.5px] font-medium text-neutral-400 ring-1 ring-neutral-200">
          <Lock className="h-2.5 w-2.5" aria-hidden />
          <span className="truncate">app.chronoswift.com/dashboard</span>
        </div>
        <span className="shrink-0 rounded bg-brand-50 px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-brand-700">
          Preview
        </span>
      </div>

      <div className="flex">
        {/* App rail */}
        <div className="hidden w-11 shrink-0 flex-col items-center gap-2.5 border-r border-neutral-100 bg-neutral-50/70 py-3 sm:flex">
          <LogoMark className="h-5 w-5" square={false} tone="brand" />
          {RAIL.map((Icon, i) => (
            <span
              key={i}
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-md",
                i === 0 ? "bg-brand-600 text-white" : "text-neutral-400"
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1 p-2.5 sm:p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-[11px] font-semibold tracking-tight text-neutral-900">
                Good morning, Ama
              </div>
              <div className="truncate text-[9px] text-neutral-500">Acme Technologies · Africa/Accra</div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-brand-700 ring-1 ring-inset ring-brand-600/15">
              <span className="relative flex h-1 w-1">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-60" />
                <span className="relative inline-flex h-1 w-1 rounded-full bg-brand-600" />
              </span>
              Live
            </span>
          </div>

          {/* Attendance summary */}
          <div className="mt-2.5 rounded-lg border border-neutral-200/80 bg-white p-2.5">
            <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
              <div>
                <div className="text-[8px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                  Today&apos;s attendance
                </div>
                <div className="mt-0.5 flex items-baseline gap-1.5">
                  <span className="text-[26px] font-semibold leading-none tracking-[-0.04em] tabular text-neutral-900">
                    93<span className="text-[13px] font-medium text-neutral-500">%</span>
                  </span>
                  <span className="text-[9px] text-neutral-500">25 of 27 in</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[8.5px] font-medium text-neutral-600">
                <Legend className="bg-brand-600" label="Present 23" />
                <Legend className="bg-amber-500" label="Late 2" />
                <Legend className="bg-red-400" label="Absent 2" />
              </div>
            </div>
            <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-neutral-100">
              <span className="bg-brand-600" style={{ width: "85%" }} />
              <span className="bg-amber-500" style={{ width: "7%" }} />
              <span className="bg-red-300" style={{ width: "8%" }} />
            </div>
          </div>

          {/* KPIs */}
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {KPIS.map(({ label, value, icon: Icon, tone }) => (
              <div key={label} className="rounded-lg border border-neutral-200/80 bg-white p-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-[7.5px] font-medium text-neutral-400">{label}</span>
                  <span className={cn("flex h-3.5 w-3.5 items-center justify-center rounded", tone)}>
                    <Icon className="h-2.5 w-2.5" aria-hidden />
                  </span>
                </div>
                <div className="mt-0.5 text-[13px] font-semibold leading-none tabular text-neutral-900">{value}</div>
              </div>
            ))}
          </div>

          {/* Activity table */}
          <div className="mt-2 rounded-lg border border-neutral-200/80 bg-white">
            <div className="flex items-center justify-between border-b border-neutral-100 px-2.5 py-1.5">
              <span className="text-[9.5px] font-semibold text-neutral-900">Today&apos;s activity</span>
              <span className="text-[8.5px] font-medium text-neutral-400">View all</span>
            </div>
            <div className="divide-y divide-neutral-100">
              {ACTIVITY.map((row) => (
                <div key={row.name} className="flex items-center gap-2 px-2.5 py-[7px]">
                  <Avatar name={row.name} size="xs" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[9.5px] font-semibold text-neutral-800">{row.name}</div>
                    <div className="truncate text-[8px] text-neutral-400">{row.department}</div>
                  </div>
                  <span className="hidden w-7 text-right text-[8.5px] tabular text-neutral-500 min-[420px]:block">
                    {row.clockIn}
                  </span>
                  <span className="hidden w-7 text-right text-[8.5px] tabular text-neutral-400 min-[520px]:block">
                    {row.clockOut}
                  </span>
                  <StatusBadge
                    value={row.status}
                    size="sm"
                    pulse={row.status === "WORKING"}
                    className="gap-1 px-1.5 py-0.5 text-[8px]"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PhoneClockPreview({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative w-[196px] rounded-[2.1rem] border-[7px] border-ink-900 bg-ink-900 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)]",
        className
      )}
    >
      <div className="overflow-hidden rounded-[1.55rem] bg-white">
        <div className="flex items-center justify-between bg-ink-900 px-3 py-1 text-[7.5px] font-semibold text-white/75">
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
            <span className="h-2 w-3.5 rounded-[2px] border border-white/50" />
          </span>
        </div>

        <div className="bg-gradient-to-b from-brand-50 to-white px-3 pb-3 pt-4 text-center">
          <div className="text-[8px] font-bold uppercase tracking-[0.16em] text-brand-600">
            Acme Technologies
          </div>
          <div className="mt-0.5 flex items-center justify-center gap-1 text-[11px] font-semibold text-neutral-900">
            <ScanLine className="h-3 w-3 text-brand-600" aria-hidden />
            Main Office
          </div>

          <div className="mx-auto mt-2.5 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
            <QrCode className="h-6 w-6" aria-hidden />
          </div>

          <div className="mt-2 text-[25px] font-semibold leading-none tracking-[-0.03em] tabular text-neutral-900">
            07:58
          </div>
          <div className="mt-1 text-[8px] font-medium text-neutral-500">Company time · Africa/Accra</div>

          <div className="mt-2.5 rounded-lg bg-brand-600 py-[7px] text-[9px] font-bold text-white shadow-sm">
            Clock In
          </div>

          <div className="mt-2 flex items-center justify-center gap-1 text-[7.5px] font-semibold text-brand-700">
            <ShieldCheck className="h-2.5 w-2.5" aria-hidden />
            Time comes from the server
          </div>
        </div>
      </div>
    </div>
  );
}

export function QrLocationsPreview({ className }: { className?: string }) {
  const locations = [
    { name: "Main Office", meta: "Reception · printed", scans: "142 scans this month" },
    { name: "Warehouse B", meta: "Loading bay · reprinted", scans: "Rotated 2 days ago" },
  ] as const;

  return (
    <div aria-hidden className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {locations.map((location, index) => (
        <div key={location.name} className="rounded-xl border border-neutral-200/80 bg-white p-3 shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-[11px] font-semibold tracking-tight text-neutral-900">
                {location.name}
              </div>
              <div className="truncate text-[9px] text-neutral-500">{location.meta}</div>
            </div>
            <StatusBadge value="ACTIVE" size="sm" className="gap-1 px-1.5 py-0.5 text-[8px]" />
          </div>

          <div className="mt-2.5 flex items-center gap-3 rounded-lg bg-neutral-50 p-2 ring-1 ring-inset ring-neutral-100">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-white ring-1 ring-neutral-200">
              <QrCode className="h-9 w-9 text-ink-950" aria-hidden />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[8.5px] font-semibold text-neutral-700">
                Scan at {location.name}
              </div>
              <div className="truncate text-[7.5px] text-neutral-400">
                /attendance/scan/{index === 0 ? "k7m2p9" : "x4v8b1"}
              </div>
              <div className="mt-1 flex gap-1">
                <span className="rounded bg-white px-1.5 py-0.5 text-[7.5px] font-semibold text-neutral-600 ring-1 ring-neutral-200">
                  Print
                </span>
                <span className="rounded bg-white px-1.5 py-0.5 text-[7.5px] font-semibold text-neutral-600 ring-1 ring-neutral-200">
                  Rotate
                </span>
              </div>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-1 text-[8px] font-medium text-neutral-400">
            <CalendarDays className="h-2.5 w-2.5" aria-hidden />
            {location.scans}
          </div>
        </div>
      ))}
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("h-1.5 w-1.5 rounded-full", className)} />
      {label}
    </span>
  );
}
