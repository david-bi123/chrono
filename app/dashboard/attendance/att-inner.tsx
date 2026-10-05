"use client";
import { useCallback, useEffect, useState } from "react";
import { Download, Pencil, CalendarDays, RefreshCw } from "lucide-react";
import { Input, Select, Textarea, Field } from "@/components/ui/input";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { PageHeader, FilterBar, SearchInput } from "@/components/ui/page-header";
import { DataTable, TablePagination, type Column } from "@/components/ui/data-table";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Modal } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { formatMinutes } from "@/lib/utils";

type Row = {
  _id: string;
  staffId?: { firstName?: string; lastName?: string; employeeId?: string; department?: string } | null;
  locationId?: { name?: string } | null;
  clockIn?: string | null;
  clockOut?: string | null;
  totalMinutes?: number;
  status: string;
  date: string;
  source?: string;
};

const STATUSES = [
  ["", "All statuses"],
  ["PRESENT", "Present"],
  ["LATE", "Late"],
  ["EARLY_LEAVE", "Early leave"],
  ["HALF_DAY", "Half day"],
  ["INCOMPLETE", "Incomplete"],
] as const;

function toLocalInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AttendancePage() {
  const { toast } = useToast();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState({ clockIn: "", clockOut: "", reason: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const load = useCallback(async (d: { date: string; status: string; search: string; page: number }) => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({
        date: d.date,
        status: d.status,
        search: d.search,
        page: String(d.page),
      });
      const r = await fetch(`/api/org/attendance?${qs}`);
      if (!r.ok) throw new Error("bad");
      const j = await r.json();
      setRows(j.rows || []);
      setTotal(j.total || 0);
      setPages(Math.max(1, j.pages || 1));
    } catch {
      setError("We couldn't load attendance records for this day.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load({ date, status, search, page });
  }, [date, status, page, load]); // eslint-disable-line react-hooks/exhaustive-deps

  function applySearch() {
    setPage(1);
    load({ date, status, search, page: 1 });
  }

  function openEdit(row: Row) {
    setEditing(row);
    setSaveError("");
    setForm({
      clockIn: toLocalInput(row.clockIn),
      clockOut: toLocalInput(row.clockOut),
      reason: "",
    });
  }

  async function saveCorrection(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setSaveError("");
    try {
      const r = await fetch(`/api/org/attendance/${editing._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clockIn: new Date(form.clockIn).toISOString(),
          clockOut: form.clockOut ? new Date(form.clockOut).toISOString() : "",
          reason: form.reason,
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        setSaveError(d.error || "We couldn't save this correction.");
        return;
      }
      toast({
        title: "Correction saved",
        description: "The change was written to the audit log.",
        variant: "success",
      });
      setEditing(null);
      load({ date, status, search, page });
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const exportHref = `/api/org/reports?from=${date}&to=${date}&format=csv`;

  const columns: Column<Row>[] = [
    {
      key: "employee",
      header: "Employee",
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar
            name={`${r.staffId?.firstName ?? ""} ${r.staffId?.lastName ?? ""}`.trim()}
            email={r.staffId?.employeeId}
            size="sm"
          />
          <div className="min-w-0">
            <div className="truncate font-medium text-neutral-900">
              {r.staffId?.firstName} {r.staffId?.lastName}
            </div>
            <div className="truncate text-[11.5px] text-neutral-500">{r.staffId?.employeeId || "—"}</div>
          </div>
        </div>
      ),
    },
    {
      key: "department",
      header: "Department",
      className: "text-neutral-600",
      hideBelow: "lg",
      render: (r) => r.staffId?.department || "—",
    },
    {
      key: "in",
      header: "Clock in",
      render: (r) => (
        <span className="tabular text-neutral-700">
          {r.clockIn ? new Date(r.clockIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
        </span>
      ),
    },
    {
      key: "out",
      header: "Clock out",
      render: (r) => (
        <span className="tabular text-neutral-700">
          {r.clockOut ? new Date(r.clockOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
        </span>
      ),
    },
    {
      key: "hours",
      header: "Hours",
      render: (r) => (
        <span className="tabular text-neutral-700">{r.totalMinutes ? formatMinutes(r.totalMinutes) : "—"}</span>
      ),
    },
    {
      key: "location",
      header: "Location",
      className: "text-neutral-600",
      hideBelow: "xl",
      render: (r) => r.locationId?.name || "—",
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge value={r.status} size="sm" />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={`Edit record for ${r.staffId?.firstName ?? "employee"}`}
          title="Correct record"
          onClick={(e) => {
            e.stopPropagation();
            openEdit(r);
          }}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Attendance"
        description="Track and manage your team's attendance. Corrections require a written reason and are audit-logged."
        actions={
          <ButtonLink href={exportHref} download variant="secondary">
            <Download className="h-4 w-4" /> Export CSV
          </ButtonLink>
        }
      />

      <FilterBar
        right={
          <span className="whitespace-nowrap text-[12.5px] font-medium text-neutral-500 tabular">
            {loading ? "Loading…" : `${total} record${total === 1 ? "" : "s"}`}
          </span>
        }
      >
        <div className="flex items-center gap-2">
          <label htmlFor="att-date" className="sr-only">
            Date
          </label>
          <Input
            id="att-date"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setPage(1);
            }}
            className="w-[152px]"
          />
        </div>
        <div className="w-[168px]">
          <Select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            {STATUSES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </div>
        <SearchInput
          label="Search attendance"
          placeholder="Search staff…"
          value={search}
          onChange={setSearch}
          onKeyDown={(e) => e.key === "Enter" && applySearch()}
          className="sm:w-56"
        />
        <Button size="sm" variant="secondary" onClick={applySearch}>
          Apply
        </Button>
      </FilterBar>

      <Card>
        <CardContent className="px-0 pb-0 pt-4 sm:px-0">
          {error ? (
            <div className="px-5 pb-5">
              <ErrorState message={error} onRetry={() => load({ date, status, search, page })} />
            </div>
          ) : (
            <>
              <div className="px-5 sm:px-6">
                <DataTable
                  columns={columns}
                  rows={rows}
                  rowKey={(r) => r._id}
                  loading={loading}
                  empty={
                    <EmptyState
                      icon={CalendarDays}
                      title="No records for this day"
                      description="Nothing has been recorded for the selected date and filters. Try another date or clear the filters."
                      action={
                        <Button size="sm" variant="secondary" onClick={() => { setStatus(""); setSearch(""); }}>
                          <RefreshCw className="h-4 w-4" /> Clear filters
                        </Button>
                      }
                    />
                  }
                  renderMobile={(r) => (
                    <div className="rounded-xl border border-neutral-200/80 bg-white p-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <Avatar
                            name={`${r.staffId?.firstName ?? ""} ${r.staffId?.lastName ?? ""}`.trim()}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <div className="truncate text-[13.5px] font-semibold text-neutral-900">
                              {r.staffId?.firstName} {r.staffId?.lastName}
                            </div>
                            <div className="truncate text-[11.5px] text-neutral-500">
                              {r.staffId?.department || "—"} · {r.locationId?.name || "No location"}
                            </div>
                          </div>
                        </div>
                        <StatusBadge value={r.status} size="sm" />
                      </div>
                      <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-neutral-100 pt-3 text-center">
                        <div>
                          <dt className="text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">In</dt>
                          <dd className="mt-0.5 text-[13px] font-medium tabular text-neutral-800">
                            {r.clockIn ? new Date(r.clockIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">Out</dt>
                          <dd className="mt-0.5 text-[13px] font-medium tabular text-neutral-800">
                            {r.clockOut ? new Date(r.clockOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[10.5px] font-semibold uppercase tracking-wide text-neutral-500">Hours</dt>
                          <dd className="mt-0.5 text-[13px] font-medium tabular text-neutral-800">
                            {r.totalMinutes ? formatMinutes(r.totalMinutes) : "—"}
                          </dd>
                        </div>
                      </dl>
                      <div className="mt-3 flex justify-end">
                        <Button size="sm" variant="outline" onClick={() => openEdit(r)}>
                          <Pencil className="h-3.5 w-3.5" /> Correct record
                        </Button>
                      </div>
                    </div>
                  )}
                />
              </div>
              {!loading && (
                <TablePagination page={page} pages={pages} total={total} onPage={setPage} label="records" />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Modal
        open={!!editing}
        onOpenChange={(o) => {
          if (!saving && !o) setEditing(null);
        }}
        title="Correct attendance record"
        description={
          editing
            ? `${editing.staffId?.firstName ?? ""} ${editing.staffId?.lastName ?? ""} · ${editing.date}`
            : undefined
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="correction-form" loading={saving}>
              Save correction
            </Button>
          </>
        }
      >
        <form id="correction-form" onSubmit={saveCorrection} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Clock in" htmlFor="c-in" required>
              <Input
                id="c-in"
                type="datetime-local"
                required
                value={form.clockIn}
                onChange={(e) => setForm({ ...form, clockIn: e.target.value })}
              />
            </Field>
            <Field label="Clock out" htmlFor="c-out" hint="Leave empty if still working">
              <Input
                id="c-out"
                type="datetime-local"
                value={form.clockOut}
                onChange={(e) => setForm({ ...form, clockOut: e.target.value })}
              />
            </Field>
          </div>
          <Field
            label="Reason"
            htmlFor="c-reason"
            required
            hint="Minimum 5 characters. Stored permanently in the audit log."
          >
            <Textarea
              id="c-reason"
              required
              minLength={5}
              placeholder="e.g. Staff forgot to scan out at reception"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </Field>
          {saveError && <p className="text-[13px] font-medium text-red-600">{saveError}</p>}
        </form>
      </Modal>
    </div>
  );
}
