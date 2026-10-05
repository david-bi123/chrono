"use client";
import { useCallback, useEffect, useState } from "react";
import { Download, BarChart3, CalendarRange, FileText } from "lucide-react";
import { Input, Select } from "@/components/ui/input";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { PageHeader, FilterBar } from "@/components/ui/page-header";
import { StatCard, StatSkeleton } from "@/components/ui/stat-card";
import { DataTable, TablePagination, type Column } from "@/components/ui/data-table";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { formatMinutes } from "@/lib/utils";

type Row = {
  _id: string;
  date: string;
  staffId?: { firstName?: string; lastName?: string; employeeId?: string; department?: string } | null;
  clockIn?: string | null;
  clockOut?: string | null;
  totalMinutes?: number;
  status: string;
};

type Summary = {
  records: number;
  present: number;
  late: number;
  earlyLeave: number;
  totalMinutes: number;
  totalStaff: number;
};

const PAGE_SIZE = 12;

function timeOf(iso?: string | null) {
  return iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
}

export default function ReportsPage() {
  const [from, setFrom] = useState(() => new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async (f: string, t: string) => {
    setLoading(true);
    setError("");
    setPage(1);
    try {
      const r = await fetch(`/api/org/reports?from=${f}&to=${t}`);
      if (!r.ok) throw new Error();
      const d = await r.json();
      setSummary(d.summary || null);
      setRows(d.rows || []);
    } catch {
      setError("We couldn't generate this report. Try a different date range.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(from, to);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const rate = summary && summary.records > 0 ? Math.round((summary.present / summary.records) * 100) : 0;
  const avgMinutes = summary && summary.records > 0 ? Math.round(summary.totalMinutes / summary.records) : 0;

  // Real aggregation across the returned rows — no fabricated figures.
  const byDepartment = (() => {
    const map = new Map<string, { records: number; present: number; late: number }>();
    for (const r of rows) {
      const key = r.staffId?.department || "Unassigned";
      const e = map.get(key) || { records: 0, present: 0, late: 0 };
      e.records++;
      if (["PRESENT", "LATE", "EARLY_LEAVE", "HALF_DAY"].includes(r.status)) e.present++;
      if (r.status === "LATE") e.late++;
      map.set(key, e);
    }
    return [...map.entries()]
      .map(([dept, v]) => ({ dept, ...v, pct: v.records ? Math.round((v.present / v.records) * 100) : 0 }))
      .sort((a, b) => b.records - a.records);
  })();

  const distribution = summary
    ? [
        { label: "Present", value: summary.present - summary.late, color: "bg-emerald-500" },
        { label: "Late", value: summary.late, color: "bg-amber-500" },
        { label: "Early leave", value: summary.earlyLeave, color: "bg-orange-400" },
      ]
    : [];

  const columns: Column<Row>[] = [
    { key: "date", header: "Date", render: (r) => <span className="font-medium text-neutral-800">{r.date}</span> },
    {
      key: "employee",
      header: "Employee",
      render: (r) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-neutral-900">
            {r.staffId?.firstName} {r.staffId?.lastName}
          </div>
          <div className="truncate text-[11.5px] text-neutral-500">{r.staffId?.employeeId || "—"}</div>
        </div>
      ),
    },
    {
      key: "dept",
      header: "Department",
      hideBelow: "lg",
      render: (r) => <span className="text-neutral-600">{r.staffId?.department || "—"}</span>,
    },
    { key: "in", header: "Clock in", render: (r) => <span className="tabular text-neutral-700">{timeOf(r.clockIn)}</span> },
    { key: "out", header: "Clock out", render: (r) => <span className="tabular text-neutral-700">{timeOf(r.clockOut)}</span> },
    {
      key: "hours",
      header: "Hours",
      render: (r) => (
        <span className="tabular text-neutral-700">{r.totalMinutes ? formatMinutes(r.totalMinutes) : "—"}</span>
      ),
    },
    { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} size="sm" /> },
  ];

  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const exportHref = `/api/org/reports?from=${from}&to=${to}&format=csv`;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        description="Attendance analytics across your organization. Every number below is computed from recorded attendance."
        actions={
          <ButtonLink href={exportHref} download variant="secondary">
            <Download className="h-4 w-4" /> Export CSV
          </ButtonLink>
        }
      />

      <FilterBar
        right={
          <Button size="sm" onClick={() => load(from, to)} loading={loading}>
            <BarChart3 className="h-4 w-4" /> Generate
          </Button>
        }
      >
        <div className="flex items-center gap-2">
          <label htmlFor="rep-from" className="text-[13px] font-medium text-neutral-500">
            From
          </label>
          <Input id="rep-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[152px]" />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="rep-to" className="text-[13px] font-medium text-neutral-500">
            To
          </label>
          <Input id="rep-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-[152px]" />
        </div>
        <span className="hidden text-[12.5px] text-neutral-500 sm:inline">
          {from} → {to}
        </span>
      </FilterBar>

      {error && <ErrorState message={error} onRetry={() => load(from, to)} />}

      {!error && loading && !summary && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
      )}

      {!error && summary && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard
              label="Attendance rate"
              value={`${rate}%`}
              tone={rate >= 90 ? "success" : rate >= 75 ? "warning" : "danger"}
              progress={rate}
              sub="of recorded days"
            />
            <StatCard label="Records" value={summary.records} tone="brand" sub={`${summary.totalStaff} staff`} />
            <StatCard label="Days present" value={summary.present} tone="success" sub="on time or late" />
            <StatCard label="Late arrivals" value={summary.late} tone={summary.late ? "warning" : "neutral"} sub="past grace period" />
            <StatCard
              label="Avg hours / day"
              value={avgMinutes ? formatMinutes(avgMinutes) : "—"}
              tone="neutral"
              sub={formatMinutes(summary.totalMinutes) + " total"}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Status mix</CardTitle>
                <CardDescription>How recorded days break down</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
                  {distribution.map((d) => (
                    <div
                      key={d.label}
                      className={`${d.color} h-full transition-all duration-500`}
                      style={{ width: `${summary.records ? (d.value / summary.records) * 100 : 0}%` }}
                    />
                  ))}
                </div>
                <ul className="mt-4 space-y-2.5 text-[13px]">
                  {distribution.map((d) => (
                    <li key={d.label} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-neutral-600">
                        <span className={`h-2.5 w-2.5 rounded-full ${d.color}`} aria-hidden />
                        {d.label}
                      </span>
                      <span className="font-medium tabular text-neutral-900">
                        {d.value}
                        <span className="ml-1.5 font-normal text-neutral-500">
                          {summary.records ? Math.round((d.value / summary.records) * 100) : 0}%
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>By department</CardTitle>
                <CardDescription>Attendance rate per department in this range</CardDescription>
              </CardHeader>
              <CardContent>
                {byDepartment.length === 0 ? (
                  <p className="py-6 text-center text-[13.5px] text-neutral-500">No records in this range.</p>
                ) : (
                  <ul className="space-y-3.5">
                    {byDepartment.map((d) => (
                      <li key={d.dept}>
                        <div className="flex items-center justify-between text-[13px]">
                          <span className="font-medium text-neutral-800">{d.dept}</span>
                          <span className="tabular text-neutral-500">
                            {d.pct}% · {d.present}/{d.records} days
                            {d.late > 0 && <span className="ml-2 text-amber-600">{d.late} late</span>}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              d.pct >= 90 ? "bg-emerald-500" : d.pct >= 75 ? "bg-amber-500" : "bg-red-400"
                            }`}
                            style={{ width: `${d.pct}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Attendance records</CardTitle>
              <CardDescription>
                <FileText className="mr-1.5 inline h-3.5 w-3.5" />
                {rows.length} record{rows.length === 1 ? "" : "s"} in this range
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0 pt-2 sm:px-0">
              {rows.length === 0 ? (
                <div className="px-5 pb-5">
                  <EmptyState
                    icon={CalendarRange}
                    title="No records in this range"
                    description="Widen the date range or check that your team has been clocking in."
                  />
                </div>
              ) : (
                <>
                  <div className="px-5 sm:px-6">
                    <DataTable columns={columns} rows={paged} rowKey={(r) => r._id} />
                  </div>
                  <TablePagination page={page} pages={pages} total={rows.length} onPage={setPage} label="records" />
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
