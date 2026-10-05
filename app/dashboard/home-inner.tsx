"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, UserCheck, AlarmClock, UserX, Briefcase, Flag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton, EmptyState } from "@/components/ui/states";
import { formatMinutes } from "@/lib/utils";
import { CalendarCheck } from "lucide-react";

interface Overview {
  orgName: string;
  timezone: string;
  date: string;
  overview: { totalStaff: number; present: number; late: number; absent: number; working: number; completed: number };
  activity: Array<{
    _id: string;
    staffId?: { firstName: string; lastName: string; employeeId?: string; department?: string };
    clockIn?: string; clockOut?: string; totalMinutes?: number; status: string;
  }>;
}

const stats = (o: Overview["overview"]) => [
  { label: "Total staff", value: o.totalStaff, icon: Users, tint: "bg-neutral-100 text-neutral-700", sub: "Active accounts" },
  { label: "Present", value: o.present, icon: UserCheck, tint: "bg-emerald-100 text-emerald-700", sub: "Clocked in today" },
  { label: "Late", value: o.late, icon: AlarmClock, tint: "bg-amber-100 text-amber-700", sub: "After grace period" },
  { label: "Absent", value: o.absent, icon: UserX, tint: "bg-red-100 text-red-700", sub: "No record today" },
  { label: "Working now", value: o.working, icon: Briefcase, tint: "bg-sky-100 text-sky-700", sub: "Not clocked out" },
  { label: "Completed", value: o.completed, icon: Flag, tint: "bg-violet-100 text-violet-700", sub: "Finished shifts" },
];

export default function DashboardHome() {
  const [data, setData] = useState<Overview | null>(null);
  useEffect(() => {
    fetch("/api/org/overview").then((r) => r.json()).then(setData).catch(() => {});
  }, []);
  if (!data) return <TableSkeleton rows={6} />;

  const total = Math.max(1, data.overview.present + data.overview.late + data.overview.absent);
  const pct = (n: number) => Math.round((n / total) * 100);

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {stats(data.overview).map((s) => (
          <Card key={s.label} className="transition hover:-translate-y-0.5 hover:shadow-lift">
            <CardContent className="p-4">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.tint}`}>
                <s.icon className="h-[18px] w-[18px]" />
              </div>
              <div className="mt-3 text-[26px] font-bold leading-none tracking-tight">{s.value}</div>
              <div className="mt-1.5 text-[13px] font-semibold">{s.label}</div>
              <div className="text-[11.5px] text-neutral-400">{s.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s mix · {data.date}</CardTitle>
          <CardDescription>{data.overview.present} present · {data.overview.late} late · {data.overview.absent} absent</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-3 overflow-hidden rounded-full bg-neutral-100">
            <div className="bg-emerald-500 transition-all" style={{ width: `${pct(data.overview.present)}%` }} />
            <div className="bg-amber-400 transition-all" style={{ width: `${pct(data.overview.late)}%` }} />
            <div className="bg-neutral-300 transition-all" style={{ width: `${pct(data.overview.absent)}%` }} />
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs font-medium text-neutral-500">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Present {pct(data.overview.present)}%</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" /> Late {pct(data.overview.late)}%</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-neutral-300" /> Absent {pct(data.overview.absent)}%</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Live activity</CardTitle>
            <CardDescription>Server-recorded timestamps · {data.timezone}</CardDescription>
          </div>
          <Link href="/dashboard/attendance" className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {data.activity.length === 0 ? (
            <EmptyState icon={CalendarCheck} title="No clock-ins yet today" description="Activity appears here as staff scan the QR code." />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="data-table">
                  <thead><tr><th>Staff</th><th>Department</th><th>Clock in</th><th>Clock out</th><th>Hours</th><th>Status</th></tr></thead>
                  <tbody>
                    {data.activity.slice(0, 10).map((a) => (
                      <tr key={a._id}>
                        <td className="font-semibold">{a.staffId?.firstName} {a.staffId?.lastName}<span className="ml-2 font-mono text-[11px] font-normal text-neutral-400">{a.staffId?.employeeId}</span></td>
                        <td className="text-neutral-500">{a.staffId?.department || "—"}</td>
                        <td className="tabular-nums">{a.clockIn ? new Date(a.clockIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                        <td className="tabular-nums">{a.clockOut ? new Date(a.clockOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                        <td className="tabular-nums">{a.totalMinutes ? formatMinutes(a.totalMinutes) : "—"}</td>
                        <td><Badge value={a.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile cards */}
              <div className="grid gap-2 md:hidden">
                {data.activity.slice(0, 10).map((a) => (
                  <div key={a._id} className="flex items-center justify-between gap-3 rounded-xl border border-neutral-100 bg-neutral-50/60 px-3.5 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-[13.5px] font-semibold">{a.staffId?.firstName} {a.staffId?.lastName}</div>
                      <div className="text-[11.5px] tabular-nums text-neutral-500">
                        {a.clockIn ? new Date(a.clockIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                        {" → "}
                        {a.clockOut ? new Date(a.clockOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "working"}
                        {a.totalMinutes ? ` · ${formatMinutes(a.totalMinutes)}` : ""}
                      </div>
                    </div>
                    <Badge value={a.status} />
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
