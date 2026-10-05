"use client";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Select } from "@/components/ui/input";
import { PageHeader, FilterBar } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { StatCard } from "@/components/ui/stat-card";
import { formatMinutes } from "@/lib/utils";

type Row = {
  _id: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  totalMinutes?: number;
  status: string;
};

const timeOf = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

export default function HistoryPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/staff/overview")
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const d = await r.json();
        setRows(d.recent || []);
      })
      .catch(() => setError("We couldn't load your history."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => (status ? rows.filter((r) => r.status === status) : rows), [rows, status]);

  const totalMinutes = filtered.reduce((a, r) => a + (r.totalMinutes || 0), 0);
  const present = filtered.filter((r) =>
    ["PRESENT", "LATE", "EARLY_LEAVE", "HALF_DAY"].includes(r.status)
  ).length;
  const rate = filtered.length ? Math.round((present / filtered.length) * 100) : 0;

  const columns: Column<Row>[] = [
    {
      key: "date",
      header: "Date",
      render: (r) => <span className="font-medium text-neutral-900">{r.date}</span>,
    },
    { key: "in", header: "Clock in", render: (r) => <span className="tabular text-neutral-700">{timeOf(r.clockIn)}</span> },
    { key: "out", header: "Clock out", render: (r) => <span className="tabular text-neutral-700">{timeOf(r.clockOut)}</span> },
    {
      key: "hours",
      header: "Hours",
      render: (r) => <span className="tabular text-neutral-700">{r.totalMinutes ? formatMinutes(r.totalMinutes) : "—"}</span>,
    },
    { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} size="sm" /> },
  ];

  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-5">
      <PageHeader title="Attendance history" description="Your recorded shifts over the last 30 days." />

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Records" value={filtered.length} tone="neutral" sub="In this view" />
          <StatCard label="Attendance rate" value={`${rate}%`} tone={rate >= 90 ? "success" : "warning"} progress={rate} />
          <StatCard label="Days present" value={present} tone="success" />
          <StatCard label="Hours worked" value={formatMinutes(totalMinutes)} tone="brand" />
        </div>
      )}

      <FilterBar>
        <div className="w-[180px]">
          <Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="PRESENT">Present</option>
            <option value="LATE">Late</option>
            <option value="EARLY_LEAVE">Early leave</option>
            <option value="HALF_DAY">Half day</option>
            <option value="INCOMPLETE">Incomplete</option>
          </Select>
        </div>
      </FilterBar>

      <Card>
        <CardContent className="px-0 pb-0 pt-4 sm:px-0">
          <div className="px-5 sm:px-6">
            <DataTable
              columns={columns}
              rows={filtered}
              rowKey={(r) => r._id}
              loading={loading}
              empty={
                <EmptyState
                  icon={CalendarDays}
                  title="No records yet"
                  description="Your attendance history will build up as you clock in and out."
                />
              }
              renderMobile={(r) => (
                <div className="rounded-xl border border-neutral-200/80 bg-white p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[13.5px] font-semibold text-neutral-900">{r.date}</span>
                    <StatusBadge value={r.status} size="sm" />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[13px] tabular text-neutral-600">
                    <span>
                      {timeOf(r.clockIn)} → {timeOf(r.clockOut)}
                    </span>
                    <span className="font-medium">{r.totalMinutes ? formatMinutes(r.totalMinutes) : "—"}</span>
                  </div>
                </div>
              )}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
