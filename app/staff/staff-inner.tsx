"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock3, QrCode, TrendingUp, AlarmClock, Hourglass, ScanLine, ArrowRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError, Hint } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard, StatSkeleton } from "@/components/ui/stat-card";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { formatMinutes } from "@/lib/utils";

type Today = {
  date?: string;
  clockIn?: string;
  clockOut?: string;
  totalMinutes?: number;
  status: string;
} | null;

type Overview = {
  orgName: string;
  timezone: string;
  today: Today;
  recent: Array<{ _id: string; date: string; clockIn?: string; clockOut?: string; totalMinutes?: number; status: string }>;
  stats: { last30Days: number; present: number; late: number; totalMinutes: number; attendancePct: number };
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const timeOf = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

export default function StaffHome({ firstName }: { firstName?: string }) {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  const load = useCallback(() => {
    setError("");
    fetch("/api/staff/overview")
      .then(async (r) => {
        if (!r.ok) throw new Error();
        setData(await r.json());
      })
      .catch(() => setError("We couldn't load your day."));
  }, []);

  useEffect(() => {
    load();
  }, [load, tick]);

  if (error) return <ErrorState message={error} onRetry={() => setTick((t) => t + 1)} />;

  if (!data) {
    return (
      <div className="space-y-5">
        <div className="space-y-2.5">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-44 w-full" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const t = data.today;
  const name = firstName || "there";
  const now = new Date();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}, ${name}`}
        description={`${now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })} · ${data.orgName}`}
      />

      {/* Today's status — the single most important card */}
      <Card className="overflow-hidden">
        <div
          className={
            "border-b border-neutral-100 px-5 py-4 sm:px-6 " +
            (!t ? "bg-neutral-50/70" : t.clockOut ? "bg-emerald-50/50" : "bg-brand-50/50")
          }
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className={
                  "flex h-9 w-9 items-center justify-center rounded-lg " +
                  (!t ? "bg-white text-neutral-500" : t.clockOut ? "bg-white text-emerald-600" : "bg-white text-brand-600")
                }
              >
                <Clock3 className="h-[18px] w-[18px]" />
              </span>
              <div>
                <div className="text-[13.5px] font-semibold text-neutral-900">Today&apos;s attendance</div>
                <div className="text-[12.5px] text-neutral-500">Times recorded by the server</div>
              </div>
            </div>
            {t ? (
              <StatusBadge value={t.status} pulse={!t.clockOut} />
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11.5px] font-medium text-neutral-500 ring-1 ring-neutral-200">
                Not clocked in
              </span>
            )}
          </div>
        </div>

        <CardContent className="py-5">
          {!t ? (
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-[15px] font-semibold text-neutral-900">
                  You haven&apos;t clocked in yet today.
                </div>
                <p className="mt-1 max-w-lg text-[13.5px] leading-relaxed text-neutral-500">
                  Scan the ChronoSwift QR code posted at your entrance with your phone camera, then tap{" "}
                  <strong className="font-semibold text-neutral-700">Clock In</strong>.
                </p>
              </div>
              <Link href="/staff/history">
                <Button variant="secondary">
                  <CalendarDays className="h-4 w-4" /> View history
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Cell label="Clock in" value={timeOf(t.clockIn)} />
              <Cell label="Clock out" value={t.clockOut ? timeOf(t.clockOut) : "Working"} />
              <Cell label="Hours today" value={t.totalMinutes ? formatMinutes(t.totalMinutes) : "—"} />
              <Cell label="Date" value={t.date || "—"} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* How to record attendance */}
      <ScanCard state={!t?.clockIn ? "in" : t?.clockOut ? "done" : "out"} />

      {/* Last 30 days */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Attendance rate"
          value={`${data.stats.attendancePct}%`}
          tone={data.stats.attendancePct >= 90 ? "success" : data.stats.attendancePct >= 75 ? "warning" : "danger"}
          progress={data.stats.attendancePct}
          sub={`Last ${data.stats.last30Days} records`}
          icon={TrendingUp}
        />
        <StatCard label="Days present" value={data.stats.present} tone="success" sub="of recorded days" icon={CalendarDays} />
        <StatCard label="Late arrivals" value={data.stats.late} tone={data.stats.late ? "warning" : "neutral"} sub="past grace period" icon={AlarmClock} />
        <StatCard
          label="Hours worked"
          value={formatMinutes(data.stats.totalMinutes)}
          tone="brand"
          sub="Last 30 records"
          icon={Hourglass}
        />
      </div>

      {/* Recent history preview */}
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>Recent days</CardTitle>
            <CardDescription>Your last recorded shifts</CardDescription>
          </div>
          <Link href="/staff/history">
            <Button size="sm" variant="secondary">
              View all
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="px-0 pb-0 sm:px-0">
          {data.recent.length === 0 ? (
            <div className="px-5 pb-5">
              <EmptyState
                icon={QrCode}
                title="No attendance recorded yet"
                description="Your first clock-in will appear here once you scan your organization's QR code."
              />
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100 px-5 sm:px-6">
              {data.recent.slice(0, 5).map((r) => (
                <li key={r._id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-medium text-neutral-900">{r.date}</div>
                    <div className="text-[12.5px] tabular text-neutral-500">
                      {timeOf(r.clockIn)} → {timeOf(r.clockOut)}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-[13px] tabular text-neutral-600">
                      {r.totalMinutes ? formatMinutes(r.totalMinutes) : "—"}
                    </span>
                    <StatusBadge value={r.status} size="sm" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ScanCard({ state }: { state: "in" | "out" | "done" }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const copy =
    state === "in"
      ? {
          title: "Scan to clock in",
          desc: "Open the ChronoSwift QR code posted at your entrance, then tap Clock In. Your time is stamped by the server.",
          cta: "Clock In",
        }
      : state === "out"
        ? {
            title: "Scan to clock out",
            desc: "Scan the same QR code when you leave and tap Clock Out to record your hours.",
            cta: "Clock Out",
          }
        : {
            title: "You're clocked out for today",
            desc: "Scan the QR code again tomorrow morning to clock in. Your next shift will show up here.",
            cta: "Clock In",
          };

  const steps = [
    `Find the printed ChronoSwift QR code at your entrance.`,
    "Point your phone camera at it and open the link.",
    `Tap ${copy.cta} — attendance is recorded instantly.`,
  ];

  function open(e: React.FormEvent) {
    e.preventDefault();
    const raw = value.trim();
    const match = raw.match(/\/attendance\/scan\/([^/?#\s]+)/);
    const token = match ? match[1] : raw;
    if (!/^[A-Za-z0-9_-]{8,}$/.test(token)) {
      setError("That doesn't look like a clock-in link. Paste the full URL you scanned.");
      return;
    }
    setError("");
    router.push(`/attendance/scan/${encodeURIComponent(token)}`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            {state === "done" ? <CheckCircle2 className="h-4 w-4" /> : <ScanLine className="h-4 w-4" />}
          </span>
          {copy.title}
        </CardTitle>
        <CardDescription>{copy.desc}</CardDescription>
      </CardHeader>

      <CardContent className="grid gap-5 md:grid-cols-2">
        <ol className="space-y-3">
          {steps.map((s, i) => (
            <li key={s} className="flex items-start gap-3 text-[13.5px] leading-relaxed text-neutral-600">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-[11px] font-semibold text-white tabular">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>

        <form onSubmit={open} className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4">
          <Label htmlFor="scan-link">Have the QR link?</Label>
          <div className="mt-1 flex gap-2">
            <Input
              id="scan-link"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (error) setError("");
              }}
              placeholder="…/attendance/scan/chr_…"
              aria-describedby="scan-link-hint"
            />
            <Button type="submit" className="shrink-0">
              Open <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <Hint>
            <span id="scan-link-hint">
              Paste the URL from the code your administrator shared — this opens the same clock-in screen.
            </span>
          </Hint>
          <FieldError message={error} />
        </form>
      </CardContent>
    </Card>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-100 bg-neutral-50/60 px-3.5 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{label}</div>
      <div className="mt-1 text-[17px] font-semibold tracking-tight tabular text-neutral-900">{value}</div>
    </div>
  );
}
