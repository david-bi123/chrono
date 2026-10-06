"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  BadgeCheck,
  CalendarDays,
  Ban,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState, ErrorState, KpiSkeleton, Skeleton } from "@/components/ui/states";
import { ConfirmDialog, Modal } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { SetupLinkPanel } from "@/components/ui/spam-notice";
import { formatMinutes } from "@/lib/utils";

type Person = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId?: string;
  department?: string;
  position?: string;
  phone?: string;
  status: string;
  createdAt?: string;
};

type Record_ = {
  _id: string;
  date: string;
  clockIn?: string | null;
  clockOut?: string | null;
  totalMinutes?: number;
  status: string;
  locationId?: { name?: string } | null;
};

type Detail = {
  staff: Person;
  range: { from: string; to: string; days: number };
  attendance: Record_[];
  summary: { records: number; present: number; late: number; totalMinutes: number; attendancePct: number };
};

const TABS = ["Overview", "Attendance"] as const;

export default function StaffProfile({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [confirm, setConfirm] = useState<{ open: boolean; next: "ACTIVE" | "DISABLED" }>({
    open: false,
    next: "DISABLED",
  });
  const [busy, setBusy] = useState(false);
  const [resendResult, setResendResult] = useState<{ email: string; link: string } | null>(null);

  const load = useCallback(() => {
    setError("");
    fetch(`/api/org/staff/${id}?days=30`)
      .then(async (r) => {
        if (!r.ok) throw new Error();
        setData(await r.json());
      })
      .catch(() => setError("We couldn't load this profile."));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle() {
    setBusy(true);
    try {
      const r = await fetch(`/api/org/staff/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: confirm.next }),
      });
      if (!r.ok) throw new Error();
      toast({
        title: confirm.next === "DISABLED" ? "Staff member deactivated" : "Staff member reactivated",
        variant: confirm.next === "DISABLED" ? "warning" : "success",
      });
      setConfirm({ open: false, next: "DISABLED" });
      load();
    } catch {
      toast({ title: "Unable to update status", variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  if (!data) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <KpiSkeleton count={4} />
      </div>
    );
  }

  const p = data.staff;
  const s = data.summary;
  const name = `${p.firstName} ${p.lastName}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-[13px] text-neutral-500">
        <Link
          href="/dashboard/staff"
          className="inline-flex items-center gap-1.5 font-medium transition hover:text-neutral-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to staff
        </Link>
      </div>

      {/* Identity header */}
      <Card>
        <CardContent className="flex flex-col gap-5 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar name={name} email={p.email} size="xl" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-semibold tracking-[-0.02em] text-neutral-900 sm:text-2xl">{name}</h1>
                <StatusBadge value={p.status} size="sm" />
              </div>
              <p className="mt-1 text-[14px] text-neutral-500">
                {p.position || "Staff member"}
                {p.department ? ` · ${p.department}` : ""}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-neutral-500">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-neutral-500" /> {p.email}
                </span>
                {p.phone && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-neutral-500" /> {p.phone}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <BadgeCheck className="h-3.5 w-3.5 text-neutral-500" /> {p.employeeId || "No employee ID"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            {p.status === "PENDING" && (
              <Button
                variant="secondary"
                onClick={async () => {
                  try {
                    const r = await fetch(`/api/org/staff/${id}/resend`, { method: "POST" });
                    const d = await r.json().catch(() => ({}));
                    if (!r.ok) throw new Error(d.error || "resend failed");
                    if (d.emailSent === false && d.setupLink) {
                      setResendResult({ email: p.email, link: d.setupLink });
                      toast({
                        title: "Invitation recreated",
                        description: "Email delivery failed — share the setup link manually.",
                        variant: "warning",
                      });
                    } else {
                      toast({ title: "Invitation resent", description: `Sent to ${p.email}.`, variant: "success" });
                    }
                  } catch {
                    toast({ title: "Unable to resend invitation", variant: "error" });
                  }
                }}
              >
                <Mail className="h-4 w-4" /> Resend invite
              </Button>
            )}
            <Button
              variant={p.status === "DISABLED" ? "default" : "outline"}
              onClick={() => setConfirm({ open: true, next: p.status === "DISABLED" ? "ACTIVE" : "DISABLED" })}
            >
              {p.status === "DISABLED" ? (
                <>
                  <RotateCcw className="h-4 w-4" /> Reactivate
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4" /> Deactivate
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Attendance rate"
          value={`${s.attendancePct}%`}
          tone={s.attendancePct >= 90 ? "success" : s.attendancePct >= 75 ? "warning" : "danger"}
          progress={s.attendancePct}
          sub={`Last ${data.range.days} days`}
        />
        <StatCard label="Days present" value={s.present} tone="brand" sub={`of ${s.records} recorded`} />
        <StatCard label="Late arrivals" value={s.late} tone={s.late > 0 ? "warning" : "neutral"} sub="Past grace period" />
        <StatCard label="Hours worked" value={formatMinutes(s.totalMinutes)} tone="neutral" sub={`Last ${data.range.days} days`} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-neutral-200/80 bg-white p-1 w-fit" role="tablist" aria-label="Profile sections">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={
              "rounded-md px-3.5 py-1.5 text-[13px] font-semibold transition-colors " +
              (tab === t ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-900")
            }
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal information</CardTitle>
              <CardDescription>Details captured when the invitation was accepted.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-neutral-100 text-[13.5px]">
                <Row label="Full name" value={name} />
                <Row label="Email" value={p.email} />
                <Row label="Phone" value={p.phone || "—"} />
                <Row label="Employee ID" value={p.employeeId || "—"} mono />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Employment</CardTitle>
              <CardDescription>Organization and access details.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-neutral-100 text-[13.5px]">
                <Row label="Department" value={p.department || "—"} />
                <Row label="Position" value={p.position || "—"} />
                <Row label="Status" value={<StatusBadge value={p.status} size="sm" />} />
                <Row
                  label="Added"
                  value={
                    p.createdAt
                      ? new Date(p.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "—"
                  }
                />
              </dl>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Attendance history</CardTitle>
            <CardDescription>
              {data.range.from} → {data.range.to}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0 sm:px-0">
            {data.attendance.length === 0 ? (
              <div className="px-5 pb-5">
                <EmptyState
                  icon={CalendarDays}
                  title="No attendance in this period"
                  description="Records appear here after this employee scans a QR code for the first time."
                />
              </div>
            ) : (
              <div className="px-5 sm:px-6">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Clock in</th>
                      <th className="hidden sm:table-cell">Clock out</th>
                      <th>Hours</th>
                      <th className="hidden lg:table-cell">Location</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.attendance.map((r) => (
                      <tr key={r._id}>
                        <td className="font-medium text-neutral-800">{r.date}</td>
                        <td className="tabular text-neutral-700">
                          {r.clockIn ? new Date(r.clockIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                        </td>
                        <td className="hidden tabular text-neutral-700 sm:table-cell">
                          {r.clockOut ? new Date(r.clockOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                        </td>
                        <td className="tabular text-neutral-700">
                          {r.totalMinutes ? formatMinutes(r.totalMinutes) : "—"}
                        </td>
                        <td className="hidden text-neutral-600 lg:table-cell">{r.locationId?.name || "—"}</td>
                        <td>
                          <StatusBadge value={r.status} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Modal
        open={!!resendResult}
        onOpenChange={(o) => {
          if (!o) setResendResult(null);
        }}
        title="Share the setup link"
        size="sm"
        footer={<Button onClick={() => setResendResult(null)}>Done</Button>}
      >
        {resendResult && <SetupLinkPanel link={resendResult.link} email={resendResult.email} />}
      </Modal>
      <ConfirmDialog
        open={confirm.open}
        onOpenChange={(o) => setConfirm({ ...confirm, open: o })}
        loading={busy}
        destructive={confirm.next === "DISABLED"}
        title={confirm.next === "DISABLED" ? "Deactivate employee?" : "Reactivate employee?"}
        description={
          confirm.next === "DISABLED"
            ? `${name} will no longer be able to clock in. This does not delete historical attendance records.`
            : `${name} will be able to sign in and clock in again.`
        }
        confirmLabel={confirm.next === "DISABLED" ? "Deactivate" : "Reactivate"}
        onConfirm={toggle}
      />
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <dt className="text-neutral-500">{label}</dt>
      <dd className={"min-w-0 truncate text-right font-medium text-neutral-900 " + (mono ? "font-mono text-[12.5px]" : "")}>
        {value}
      </dd>
    </div>
  );
}
