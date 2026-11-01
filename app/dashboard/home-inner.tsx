"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  AlarmClock,
  UserX,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  Clock3,
  LogIn,
  LogOut,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard, StatSkeleton } from "@/components/ui/stat-card";
import { EmptyState, ErrorState, KpiSkeleton, Skeleton } from "@/components/ui/states";
import { LinkButton } from "@/components/ui/button";
import { cn, formatMinutes } from "@/lib/utils";

interface ActivityRow {
  _id: string;
  staffId?: { firstName: string; lastName: string; employeeId?: string; department?: string };
  clockIn?: string;
  clockOut?: string;
  totalMinutes?: number;
  status: string;
}

interface Overview {
  orgName: string;
  timezone: string;
  date: string;
  overview: { totalStaff: number; present: number; late: number; absent: number; working: number; completed: number };
  activity: ActivityRow[];
}

function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function timeOf(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function DashboardHome({ userName }: { userName?: string }) {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);

  const load = useCallback(() => {
    setError(false);
    setData(null);
    fetch("/api/org/overview")
      .then(async (r) => {
        if (!r.ok) throw new Error("failed");
        const d = await r.json();
        setData(d);
      })
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    load();
  }, [load, tick]);

  const firstName = (userName || "there").split(" ")[0];

  const timeline = useMemo(() => {
    const events: Array<{ id: string; time: string; text: string; type: "in" | "out" }> = [];
    for (const a of data?.activity || []) {
      const name = a.staffId ? `${a.staffId.firstName} ${a.staffId.lastName}` : "A team member";
      if (a.clockIn) events.push({ id: `${a._id}-in`, time: timeOf(a.clockIn)!, text: `${name} clocked in`, type: "in" });
      if (a.clockOut) events.push({ id: `${a._id}-out`, time: timeOf(a.clockOut)!, text: `${name} clocked out`, type: "out" });
    }
    return events.sort((a, b) => b.time.localeCompare(a.time)).slice(0, 8);
  }, [data]);

  /** Names of staff who arrived after the grace period today — real records only. */
  const lateNames = useMemo(
    () =>
      (data?.activity || [])
        .filter((a) => a.status === "LATE")
        .map((a) => `${a.staffId?.firstName ?? ""} ${a.staffId?.lastName ?? ""}`.trim())
        .filter(Boolean),
    [data]
  );

  if (error) {
    return (
      <ErrorState
        title="We couldn't load today's overview"
        message="Something interrupted the request. Check your connection and try again."
        onRetry={() => setTick((t) => t + 1)}
      />
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="space-y-2.5">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <StatSkeleton />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </div>
        </div>
        <KpiSkeleton count={4} />
      </div>
    );
  }

  const o = data.overview;
  const rate = o.totalStaff > 0 ? Math.round((o.present / o.totalStaff) * 100) : 0;
  const pct = (n: number) => (o.totalStaff > 0 ? Math.round((n / o.totalStaff) * 100) : 0);

  // Actionable items — every number below comes from today's records.
  const attention: Array<{
    key: string;
    icon: typeof AlarmClock;
    chip: string;
    label: string;
    value: number;
    detail: string;
    href: string;
    cta: string;
  }> = [];
  if (o.late > 0) {
    const names = lateNames.slice(0, 3).join(", ");
    attention.push({
      key: "late",
      icon: AlarmClock,
      chip: "bg-amber-50 text-amber-700 ring-amber-200",
      label: "Late arrivals",
      value: o.late,
      detail: names
        ? `${names}${lateNames.length > 3 ? ` +${lateNames.length - 3} more` : ""}`
        : "Past the grace period",
      href: "/dashboard/attendance?status=LATE",
      cta: "Review late records",
    });
  }
  if (o.absent > 0) {
    attention.push({
      key: "absent",
      icon: UserX,
      chip: "bg-red-50 text-red-700 ring-red-200",
      label: "No clock-in today",
      value: o.absent,
      detail: "Active staff without a record today",
      href: "/dashboard/attendance",
      cta: "Open attendance",
    });
  }
  if (o.working > 0) {
    attention.push({
      key: "working",
      icon: Briefcase,
      chip: "bg-brand-50 text-brand-700 ring-brand-200",
      label: "Still on the clock",
      value: o.working,
      detail: "Clocked in, not clocked out yet",
      href: "/dashboard/attendance",
      cta: "View records",
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        description={`Here's what's happening with ${data.orgName || "your team"} today.`}
      />

      {/* Attendance overview + compact KPIs */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5">Today&apos;s attendance
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-600" />
                </span>
                Live
              </span>
            </CardTitle>
            <CardDescription>
              {data.date} · timestamps in {data.timezone}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
              <div>
                <div className="text-[44px] font-semibold leading-none tracking-[-0.04em] tabular text-neutral-900">
                  {rate}
                  <span className="text-[24px] font-medium text-neutral-500">%</span>
                </div>
                <div className="mt-2 text-sm font-medium text-neutral-500">of {o.totalStaff} staff present</div>
              </div>
              <div className="flex flex-1 flex-wrap gap-x-6 gap-y-2 text-sm">
                <Legend color="bg-brand-600" label="Present" value={o.present} pct={pct(o.present)} />
                <Legend color="bg-amber-500" label="Late" value={o.late} pct={pct(o.late)} />
                <Legend color="bg-red-400" label="Absent" value={o.absent} pct={pct(o.absent)} />
              </div>
            </div>

            <div className="mt-5 flex h-2.5 w-full overflow-hidden rounded-full bg-neutral-100" role="img" aria-label={`${rate}% present`}>
              <Bar width={pct(o.present)} className="bg-brand-600 transition-all duration-700" />
              <Bar width={pct(o.late)} className="bg-amber-500 transition-all duration-700" />
              <Bar width={pct(o.absent)} className="bg-red-300 transition-all duration-700" />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Total staff" value={o.totalStaff} icon={Users} tone="neutral" sub="Active accounts" />
          <StatCard label="Working now" value={o.working} icon={Briefcase} tone="brand" sub="Not clocked out" />
          <StatCard label="Late" value={o.late} icon={AlarmClock} tone="warning" sub="Past grace period" />
          <StatCard label="Absent" value={o.absent} icon={UserX} tone="danger" sub="No record today" />
        </div>
      </div>

      {/* Activity + timeline */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>Today&apos;s activity</CardTitle>
              <CardDescription>Live clock-ins recorded by the server</CardDescription>
            </div>
            <Link
              href="/dashboard/attendance"
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-[13px] font-semibold text-neutral-700 transition hover:bg-neutral-50"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {data.activity.length === 0 ? (
              <EmptyState
                icon={Clock3}
                title="No clock-ins yet today"
                description="Activity appears here the moment a team member scans a location QR code."
                action={
                  <LinkButton href="/dashboard/qr" variant="secondary" size="sm">
                    Manage QR codes
                  </LinkButton>
                }
              />
            ) : (
              <>
                <div className="-mx-5 hidden overflow-x-auto px-5 md:block">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Staff</th>
                        <th className="hidden lg:table-cell">Department</th>
                        <th>Clock in</th>
                        <th className="hidden lg:table-cell">Clock out</th>
                        <th>Hours</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.activity.slice(0, 8).map((a) => {
                        const working = !a.clockOut && ["PRESENT", "LATE"].includes(a.status);
                        return (
                          <tr key={a._id}>
                            <td>
                              <div className="flex items-center gap-2.5">
                                <Avatar
                                  name={`${a.staffId?.firstName ?? ""} ${a.staffId?.lastName ?? ""}`.trim()}
                                  size="sm"
                                />
                                <div className="min-w-0">
                                  <div className="truncate font-medium text-neutral-900">
                                    {a.staffId?.firstName} {a.staffId?.lastName}
                                  </div>
                                  <div className="truncate text-[12.5px] text-neutral-500 lg:hidden">
                                    {a.staffId?.department || "—"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="hidden text-neutral-500 lg:table-cell">{a.staffId?.department || "—"}</td>
                            <td className="tabular text-neutral-700">{timeOf(a.clockIn) ?? "—"}</td>
                            <td className="hidden tabular text-neutral-700 lg:table-cell">{timeOf(a.clockOut) ?? "—"}</td>
                            <td className="tabular text-neutral-700">{a.totalMinutes ? formatMinutes(a.totalMinutes) : "—"}</td>
                            <td>
                              <StatusBadge value={working ? "WORKING" : a.status} pulse={working} size="sm" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <ul className="flex flex-col gap-2 md:hidden">
                  {data.activity.slice(0, 8).map((a) => {
                    const working = !a.clockOut && ["PRESENT", "LATE"].includes(a.status);
                    return (
                      <li
                        key={a._id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-neutral-100 bg-neutral-50/60 px-3.5 py-3"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <Avatar
                            name={`${a.staffId?.firstName ?? ""} ${a.staffId?.lastName ?? ""}`.trim()}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-neutral-900">
                              {a.staffId?.firstName} {a.staffId?.lastName}
                            </div>
                            <div className="text-[12.5px] tabular text-neutral-500">
                              {timeOf(a.clockIn) ?? "—"} → {timeOf(a.clockOut) ?? "working"}
                              {a.totalMinutes ? ` · ${formatMinutes(a.totalMinutes)}` : ""}
                            </div>
                          </div>
                        </div>
                        <StatusBadge value={working ? "WORKING" : a.status} pulse={working} size="sm" />
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Latest clock-ins and clock-outs</CardDescription>
          </CardHeader>
          <CardContent>
            {timeline.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-500">
                Events will appear as your team clocks in.
              </p>
            ) : (
              <ol className="relative space-y-4 before:absolute before:left-[7px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-neutral-100">
                {timeline.map((e) => (
                  <li key={e.id} className="relative flex gap-3.5 pl-0">
                    <span
                      className={`relative z-10 mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full ring-4 ring-white ${
                        e.type === "in" ? "bg-brand-500" : "bg-neutral-400"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold tabular text-neutral-900">{e.time}</span>
                        {e.type === "in" ? (
                          <LogIn className="h-3 w-3 text-brand-500" aria-hidden />
                        ) : (
                          <LogOut className="h-3 w-3 text-neutral-500" aria-hidden />
                        )}
                      </div>
                      <div className="truncate text-sm text-neutral-600">{e.text}</div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        {/* Needs attention — live, actionable items for today */}
        <Card>
          <CardHeader>
            <CardTitle>Needs attention</CardTitle>
            <CardDescription>What needs a decision today</CardDescription>
          </CardHeader>
          <CardContent>
            {attention.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl bg-brand-50/70 px-3.5 py-3.5 ring-1 ring-inset ring-brand-100">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand-600">
                  <CheckCircle2 className="h-[18px] w-[18px]" aria-hidden />
                </span>
                <p className="text-[13.5px] font-medium leading-relaxed text-brand-800">
                  Everyone is present and on time today.
                </p>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {attention.map((a) => (
                  <li key={a.key}>
                    <Link
                      href={a.href}
                      className="group flex items-start gap-3 rounded-xl border border-neutral-200/80 bg-white px-3.5 py-3 transition hover:border-brand-200 hover:bg-brand-50/40"
                    >
                      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset", a.chip)}>
                        <a.icon className="h-[18px] w-[18px]" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-semibold text-neutral-900">{a.label}</span>
                          <span className="tabular text-sm font-bold text-neutral-900">{a.value}</span>
                        </span>
                        <span className="mt-0.5 block truncate text-[12.5px] text-neutral-500">{a.detail}</span>
                        <span className="mt-1 inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand-700">
                          {a.cta}
                          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Completed shifts */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <div className="text-[15px] font-semibold tabular text-neutral-900">
                {o.completed} of {o.totalStaff} shifts completed
              </div>
              <div className="text-sm text-neutral-500">Finished and clocked out today</div>
            </div>
          </div>
          <LinkButton href="/dashboard/reports" variant="secondary" size="sm">
            <UserCheck className="h-4 w-4" /> Open reports
          </LinkButton>
        </CardContent>
      </Card>
    </div>
  );
}

function Bar({ width, className }: { width: number; className?: string }) {
  if (width <= 0) return null;
  return <div className={className} style={{ width: `${width}%` }} />;
}

function Legend({ color, label, value, pct }: { color: string; label: string; value: number; pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} aria-hidden />
      <span className="font-medium text-neutral-700">{label}</span>
      <span className="tabular text-neutral-500">
        {value} · {pct}%
      </span>
    </div>
  );
}
