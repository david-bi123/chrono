"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  UserX,
  AlarmClock,
  Percent,
  Radio,
  ArrowUpRight,
  Building2,
  Clock3,
  LogIn,
  LogOut,
  RefreshCw,
  BarChart3,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard, StatSkeleton } from "@/components/ui/stat-card";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { StatusBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TrendPoint {
  date: string;
  present: number;
  late: number;
  early: number;
  absent: number;
}

interface Overview {
  orgName: string;
  timezone: string;
  date: string;
  overview: {
    totalStaff: number;
    present: number;
    late: number;
    absent: number;
    working: number;
    completed: number;
    early: number;
    todayRate: number;
    weeklyRate: number;
  };
  trend: { week: TrendPoint[]; month: TrendPoint[] };
  branches: Array<{ id: string; name: string; present: number; late: number; absent: number }>;
  statusBreakdown: Array<{ status: string; count: number }>;
  activity: Array<{
    _id: string;
    status: string;
    clockIn?: string | null;
    clockOut?: string | null;
    createdAt: string;
    staffId?: { firstName?: string; lastName?: string; employeeId?: string; department?: string } | null;
    locationId?: { name?: string } | null;
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  PRESENT: "bg-brand-500",
  LATE: "bg-amber-500",
  EARLY_LEAVE: "bg-sky-500",
  HALF_DAY: "bg-violet-500",
  INCOMPLETE: "bg-neutral-400",
  ABSENT: "bg-red-400",
};

function timeOf(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function dayLabel(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

function shortDate(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/** Shared empty state so a data-less chart reads as "nothing yet", not broken. */
function ChartEmpty({ label }: { label: string }) {
  return (
    <div className="flex h-44 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 px-4 text-center">
      <BarChart3 className="h-5 w-5 text-neutral-300" aria-hidden />
      <p className="text-[12.5px] font-medium text-neutral-600">{label}</p>
      <p className="text-[11.5px] text-neutral-400">Records appear here as soon as staff clock in.</p>
    </div>
  );
}

/** Seven-day stacked attendance chart (present + late inside the staff track). */
function WeekChart({ data, totalStaff }: { data: TrendPoint[]; totalStaff: number }) {
  if (!data.some((d) => d.present > 0 || d.late > 0)) {
    return <ChartEmpty label="No clock-ins in the last 7 days" />;
  }
  const max = Math.max(1, totalStaff, ...data.map((d) => d.present));
  return (
    <div className="flex h-44 items-end gap-2 sm:gap-3" role="img" aria-label="Attendance for the last seven days">
      {data.map((d) => {
        const presentPct = (d.present / max) * 100;
        const latePct = (d.late / max) * 100;
        return (
          <div key={d.date} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full flex-1 items-end justify-center">
              <div
                className="group relative flex w-full max-w-[44px] flex-col-reverse overflow-hidden rounded-t-md bg-neutral-100"
                style={{ height: `${Math.max(4, presentPct)}%` }}
                title={`${shortDate(d.date)} · ${d.present} present, ${d.late} late`}
              >
                <div className="w-full bg-brand-500 transition-all" style={{ height: `${(d.present / Math.max(1, d.present)) * 100}%` }} />
                {d.late > 0 && (
                  <div
                    className="absolute inset-x-0 top-0 bg-amber-400"
                    style={{ height: `${Math.min(100, (latePct / Math.max(1, presentPct)) * 100)}%` }}
                  />
                )}
              </div>
            </div>
            <span className="text-[10.5px] font-medium text-neutral-500">{dayLabel(d.date)}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Thirty-day present trend as an SVG area chart. */
function MonthChart({ data, totalStaff }: { data: TrendPoint[]; totalStaff: number }) {
  const [hover, setHover] = useState<number | null>(null);
  if (!data.some((d) => d.present > 0 || d.late > 0)) {
    return <ChartEmpty label="No clock-ins in the last 30 days" />;
  }
  const width = 640;
  const height = 170;
  const pad = { top: 12, right: 8, bottom: 22, left: 8 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(1, totalStaff, ...data.map((d) => d.present));

  const points = data.map((d, i) => {
    const x = pad.left + (i / Math.max(1, data.length - 1)) * innerW;
    const y = pad.top + innerH - (d.present / max) * innerH;
    return { x, y, ...d };
  });
  const line = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${pad.left},${pad.top + innerH} ${line} ${pad.left + innerW},${pad.top + innerH}`;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-44 w-full"
        role="img"
        aria-label="Present staff per day over the last thirty days"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="monthFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(57 118 90)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="rgb(57 118 90)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={pad.left}
            x2={width - pad.right}
            y1={pad.top + innerH - innerH * f}
            y2={pad.top + innerH - innerH * f}
            stroke="rgb(229 229 229)"
            strokeDasharray="3 4"
          />
        ))}
        <polygon points={area} fill="url(#monthFill)" />
        <polyline
          points={line}
          fill="none"
          stroke="rgb(57 118 90)"
          strokeWidth="2.25"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p, i) => (
          <g key={p.date}>
            <circle
              cx={p.x}
              cy={p.y}
              r={hover === i ? 4 : 0}
              fill="white"
              stroke="rgb(57 118 90)"
              strokeWidth="2"
            />
            <rect
              x={p.x - innerW / Math.max(1, data.length) / 2}
              y={pad.top}
              width={innerW / Math.max(1, data.length)}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          </g>
        ))}
        {[0, Math.floor(data.length / 2), data.length - 1].map((i) => {
          const p = points[i];
          if (!p) return null;
          return (
            <text key={i} x={p.x} y={height - 6} textAnchor="middle" className="fill-neutral-400 text-[9px]">
              {shortDate(p.date)}
            </text>
          );
        })}
      </svg>

      {hover !== null && points[hover] && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-neutral-700 shadow-card"
          style={{ left: `${(points[hover].x / width) * 100}%`, top: 0 }}
        >
          {shortDate(points[hover].date)} · {points[hover].present} present
          {points[hover].late > 0 ? `, ${points[hover].late} late` : ""}
        </div>
      )}
    </div>
  );
}

function RateRing({ value }: { value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 64 64" className="h-20 w-20 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgb(245 245 245)" strokeWidth="6" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="rgb(57 118 90)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${(clamped / 100) * c} ${c}`}
          className="transition-[stroke-dasharray] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-semibold leading-none tabular text-neutral-900">{Math.round(clamped)}%</span>
        <span className="mt-0.5 text-[9.5px] font-medium text-neutral-500">today</span>
      </div>
    </div>
  );
}

export default function DashboardHome() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [tick, setTick] = useState(0);
  const lastLoaded = useRef<Date | null>(null);

  const load = useCallback(async (soft = false) => {
    if (soft) setRefreshing(true);
    setError("");
    try {
      const res = await fetch("/api/org/overview", { cache: "no-store" });
      if (!res.ok) throw new Error();
      setData((await res.json()) as Overview);
      lastLoaded.current = new Date();
    } catch {
      setError("We couldn't load your dashboard.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load, tick]);

  useEffect(() => {
    const id = window.setInterval(() => load(true), 60_000);
    return () => window.clearInterval(id);
  }, [load]);

  const breakdown = useMemo(() => {
    if (!data) return [];
    const total = data.statusBreakdown.reduce((sum, s) => sum + s.count, 0);
    return data.statusBreakdown.map((s) => ({
      ...s,
      pct: total > 0 ? Math.round((s.count / total) * 100) : 0,
    }));
  }, [data]);

  if (error) {
    return <ErrorState message={error} onRetry={() => setTick((t) => t + 1)} />;
  }

  if (!data) {
    return (
      <div className="space-y-5">
        <div className="space-y-2.5">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  const o = data.overview;
  const todayLabel = new Date(`${data.date}T12:00:00Z`).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description={`${todayLabel} · times shown in ${data.timezone.replace(/_/g, " ")}`}
        actions={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11.5px] font-semibold text-brand-700">
              <span className="relative flex h-1.5 w-1.5" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-500" />
              </span>
              Live
            </span>
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 text-[12.5px] font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-60"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
              Refresh
            </button>
          </div>
        }
      />

      {/* Attendance summary */}
      <Card className="overflow-hidden">
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <div className="flex items-center gap-4">
            <RateRing value={o.todayRate} />
            <div>
              <div className="text-[13px] font-medium text-neutral-500">Attendance today</div>
              <div className="mt-0.5 text-[15px] font-semibold text-neutral-900">
                {o.present} of {o.totalStaff} present
              </div>
              <div className="mt-1 text-[12.5px] text-neutral-500">
                {o.working} still clocked in · {o.completed} checked out
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:px-4">
            {[
              { label: "Present", value: o.present, tone: "text-brand-700" },
              { label: "Absent", value: o.absent, tone: "text-red-600" },
              { label: "Late", value: o.late, tone: "text-amber-600" },
              { label: "Early leave", value: o.early, tone: "text-sky-600" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-neutral-50/80 px-3 py-2.5">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{item.label}</div>
                <div className={cn("mt-0.5 text-xl font-semibold tabular", item.tone)}>{item.value}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3">
            <Percent className="h-5 w-5 shrink-0 text-brand-600" />
            <div>
              <div className="text-[12px] font-medium text-brand-800">7-day attendance rate</div>
              <div className="text-lg font-semibold tabular text-brand-900">{o.weeklyRate}%</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total employees" value={o.totalStaff} icon={Users} tone="neutral" sub="Active staff accounts" />
        <StatCard label="Present today" value={o.present} icon={UserCheck} tone="success" sub={`${o.todayRate}% of active staff`} />
        <StatCard label="Absent today" value={o.absent} icon={UserX} tone="danger" sub="No record yet today" />
        <StatCard label="Late arrivals" value={o.late} icon={AlarmClock} tone="warning" sub="After the grace window" />
        <StatCard
          label="Clocked in now"
          value={o.working}
          icon={Radio}
          tone="sky"
          sub={`${o.completed} finished`}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>Attendance trend</CardTitle>
              <CardDescription>Present staff per day over the last 30 days</CardDescription>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-600">
              <ArrowUpRight className="h-3 w-3" /> 30 days
            </span>
          </CardHeader>
          <CardContent>
            <MonthChart data={data.trend.month} totalStaff={o.totalStaff} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>This week</CardTitle>
            <CardDescription>Last seven days at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <WeekChart data={data.trend.week} totalStaff={o.totalStaff} />
            {data.trend.week.some((d) => d.present > 0 || d.late > 0) && (
              <div className="mt-4 flex items-center gap-4 text-[11.5px] font-medium text-neutral-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-brand-500" /> Present
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400" /> Late
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Breakdown + branches + activity */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Status breakdown</CardTitle>
            <CardDescription>Today&apos;s records by outcome</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {breakdown.map((item) => (
              <div key={item.status}>
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="font-medium capitalize text-neutral-700">
                    {item.status.replace(/_/g, " ").toLowerCase()}
                  </span>
                  <span className="font-semibold tabular text-neutral-900">{item.count}</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className={cn("h-full rounded-full", STATUS_COLORS[item.status] || "bg-neutral-400")}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-neutral-400" /> Branch performance
            </CardTitle>
            <CardDescription>Clock-ins recorded today by branch</CardDescription>
          </CardHeader>
          <CardContent>
            {data.branches.length === 0 ? (
              <p className="rounded-lg bg-neutral-50 px-3.5 py-3 text-[13px] text-neutral-500">
                No branch activity yet today.{" "}
                <Link href="/dashboard/qr" className="font-semibold text-brand-700 hover:underline">
                  Manage branches
                </Link>
              </p>
            ) : (
              <ul className="space-y-3.5">
                {data.branches.slice(0, 5).map((b) => {
                  const pct = o.totalStaff > 0 ? Math.round((b.present / o.totalStaff) * 100) : 0;
                  return (
                    <li key={b.id}>
                      <div className="flex items-center justify-between gap-3 text-[13px]">
                        <span className="truncate font-medium text-neutral-800">{b.name}</span>
                        <span className="shrink-0 font-semibold tabular text-neutral-900">
                          {b.present}
                          {b.late > 0 && (
                            <span className="ml-1 text-[11.5px] font-medium text-amber-600">{b.late} late</span>
                          )}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                        <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>Clock events from today</CardDescription>
            </div>
            <Link
              href="/dashboard/attendance"
              className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand-700 hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {data.activity.length === 0 ? (
              <p className="rounded-lg bg-neutral-50 px-3.5 py-3 text-[13px] text-neutral-500">
                No attendance recorded yet today.
              </p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {data.activity.slice(0, 6).map((a) => {
                  const name = `${a.staffId?.firstName ?? "Unknown"} ${a.staffId?.lastName ?? ""}`.trim();
                  const out = Boolean(a.clockOut);
                  return (
                    <li key={a._id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          out ? "bg-sky-50 text-sky-600" : "bg-brand-50 text-brand-600"
                        )}
                      >
                        {out ? <LogOut className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium text-neutral-900">{name}</div>
                        <div className="truncate text-[11.5px] text-neutral-500">
                          {out ? "Checked out" : "Clocked in"} {out ? timeOf(a.clockOut) : timeOf(a.clockIn)}
                          {a.locationId?.name ? ` · ${a.locationId.name}` : ""}
                        </div>
                      </div>
                      <StatusBadge value={a.status} size="sm" />
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="flex items-center gap-1.5 text-[11.5px] text-neutral-400">
        <Clock3 className="h-3 w-3" />
        Updated {lastLoaded.current ? lastLoaded.current.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "just now"} · refreshes automatically every minute
      </p>
    </div>
  );
}
