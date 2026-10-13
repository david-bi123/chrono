"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ScanLine, ArrowRight, Clock3, CheckCircle2, MapPin, AlertTriangle, LogIn } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError, Hint } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { formatMinutes } from "@/lib/utils";

type Today = {
  date?: string;
  clockIn?: string;
  clockOut?: string;
  totalMinutes?: number;
  status: string;
} | null;

interface ScanState {
  orgName: string;
  locationName: string;
  display: { displayDate: string; displayTime: string };
  timezone: string;
  authenticated: boolean;
  sessionEmail: string | null;
  belongs: boolean;
  attendance: { clockIn?: string; clockOut?: string; status: string; totalMinutes?: number } | null;
}

const timeOf = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

export default function ClockPage({ token }: { token?: string }) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Clock in & out"
        description="Record your attendance by scanning your organization's QR code. Times are stamped by the server the moment you tap."
      />

      {token ? <LocationClock token={token} /> : <TodayStatus />}

      <HowTo showOpener={!token} />
    </div>
  );
}

/* ---------- No token: today's overview from the staff API ---------- */

function TodayStatus() {
  const [today, setToday] = useState<Today>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setError("");
    fetch("/api/staff/overview")
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const d = await r.json();
        setToday(d.today || null);
        setLoaded(true);
      })
      .catch(() => setError("We couldn't load today's status."));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error && !loaded) return <ErrorState message={error} onRetry={load} />;

  const clockedIn = Boolean(today?.clockIn);
  const clockedOut = Boolean(today?.clockOut);

  return (
    <Card className="overflow-hidden">
      <div
        className={
          "border-b border-neutral-100 px-5 py-4 sm:px-6 " +
          (!today ? "bg-neutral-50/70" : clockedOut ? "bg-emerald-50/50" : "bg-brand-50/50")
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className={
                "flex h-9 w-9 items-center justify-center rounded-lg " +
                (!today ? "bg-white text-neutral-500" : clockedOut ? "bg-white text-emerald-600" : "bg-white text-brand-600")
              }
            >
              {clockedOut ? <CheckCircle2 className="h-[18px] w-[18px]" /> : <Clock3 className="h-[18px] w-[18px]" />}
            </span>
            <div>
              <div className="text-[13.5px] font-semibold text-neutral-900">Today&apos;s attendance</div>
              <div className="text-[12.5px] text-neutral-500">
                {!loaded
                  ? "Checking…"
                  : !today
                    ? "You haven't clocked in yet"
                    : clockedOut
                      ? `Clocked out at ${timeOf(today.clockOut)}`
                      : `Clocked in at ${timeOf(today.clockIn)} — you're on the clock`}
              </div>
            </div>
          </div>
          {loaded && today && <StatusBadge value={today.status} pulse={!clockedOut} />}
        </div>
      </div>

      <CardContent className="py-5">
        {!loaded ? (
          <div className="space-y-2.5">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        ) : today ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Cell label="Clock in" value={timeOf(today.clockIn)} />
            <Cell label="Clock out" value={today.clockOut ? timeOf(today.clockOut) : "Working"} />
            <Cell label="Hours today" value={today.totalMinutes ? formatMinutes(today.totalMinutes) : "—"} />
            <Cell label="Date" value={today.date || "—"} />
          </div>
        ) : (
          <p className="max-w-lg text-[13.5px] leading-relaxed text-neutral-500">
            Your day starts when you scan the QR code posted at your entrance and tap Clock In below.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------- Token mode: clock directly for the scanned location ---------- */

function LocationClock({ token }: { token: string }) {
  const [info, setInfo] = useState<ScanState | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [flash, setFlash] = useState<"in" | "out" | null>(null);

  const valid = /^[A-Za-z0-9_-]{8,}$/.test(token);

  const load = useCallback(() => {
    if (!valid) {
      setError("This link doesn't look like a clock-in code. Ask your administrator for a fresh QR code.");
      return;
    }
    setError("");
    fetch(`/api/attendance/scan/${encodeURIComponent(token)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) setError(d.error || "This QR code isn't valid.");
        else setInfo(d);
      })
      .catch(() => setError("We couldn't reach ChronoSwift. Check your connection and try again."));
  }, [token, valid]);

  useEffect(() => {
    load();
  }, [load]);

  async function clock(mode: "in" | "out") {
    setBusy(true);
    setActionError("");
    try {
      const r = await fetch(`/api/attendance/clock?mode=${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationToken: token }),
      });
      const d = await r.json();
      if (!r.ok) {
        setActionError(d.error || "We couldn't record that. Please try again.");
        return;
      }
      setFlash(mode);
      const r2 = await fetch(`/api/attendance/scan/${encodeURIComponent(token)}`);
      const d2 = await r2.json();
      if (r2.ok) setInfo(d2);
    } catch {
      setActionError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <EmptyState
            icon={AlertTriangle}
            title="QR unavailable"
            description={error}
            action={
              <Link href="/staff/clock">
                <Button variant="secondary" size="sm">
                  Back to Clock In
                </Button>
              </Link>
            }
          />
        </CardContent>
      </Card>
    );
  }

  if (!info) {
    return (
      <Card>
        <CardContent className="space-y-3 py-6" aria-busy="true" aria-live="polite">
          <Skeleton className="h-6 w-40 rounded-lg" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-52 w-full" />
          <span className="sr-only">Loading clock-in details…</span>
        </CardContent>
      </Card>
    );
  }

  if (!info.authenticated) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <LogIn className="h-5 w-5" />
          </div>
          <div className="mt-4 text-[17px] font-semibold tracking-tight text-neutral-900">Sign in to clock in</div>
          <p className="mx-auto mt-1.5 max-w-sm text-[14px] leading-relaxed text-neutral-500">
            Your session expired — sign in to record attendance at {info.locationName}.
          </p>
          <Link
            href={`/login?next=${encodeURIComponent(`/staff/clock?token=${encodeURIComponent(token)}`)}`}
            className="mx-auto mt-5 block w-full max-w-xs rounded-xl bg-brand-600 px-4 py-3 text-center text-[15px] font-semibold text-white shadow-xs transition hover:bg-brand-700 active:translate-y-px"
          >
            Sign in
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!info.belongs) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="mt-4 text-[17px] font-semibold tracking-tight text-neutral-900">This code isn&apos;t for you</div>
          <p className="mx-auto mt-1.5 max-w-sm text-[14px] leading-relaxed text-neutral-500">
            It belongs to <strong className="font-semibold text-neutral-800">{info.orgName}</strong>, which your
            account can&apos;t access.
          </p>
          {info.sessionEmail && (
            <p className="mt-2 text-[13px] text-neutral-500">
              You&apos;re signed in as <span className="font-medium text-neutral-700">{info.sessionEmail}</span>.
            </p>
          )}
          <Link
            href={`/login?next=${encodeURIComponent(`/staff/clock?token=${encodeURIComponent(token)}`)}`}
            className="mx-auto mt-5 block w-full max-w-xs rounded-xl bg-brand-600 px-4 py-3 text-center text-[15px] font-semibold text-white shadow-xs transition hover:bg-brand-700 active:translate-y-px"
          >
            Switch account
          </Link>
        </CardContent>
      </Card>
    );
  }

  const att = info.attendance;
  const clockedIn = Boolean(att?.clockIn);
  const clockedOut = Boolean(att?.clockOut);
  const justClockedIn = flash === "in" && clockedIn && !clockedOut;
  const justClockedOut = flash === "out" && clockedOut;

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-neutral-100 bg-neutral-50/60 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1.5 text-[13px] font-medium text-neutral-600">
            <MapPin className="h-4 w-4 shrink-0 text-brand-500" />
            <span className="truncate">{info.orgName}</span>
            <span className="text-neutral-300">·</span>
            <span className="truncate font-semibold text-neutral-800">{info.locationName}</span>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">{info.display.displayDate}</div>
            <div className="text-[22px] font-semibold leading-none tracking-[-0.02em] tabular text-neutral-900">
              {info.display.displayTime}
            </div>
          </div>
        </div>
      </div>

      <CardContent>
        <div className="px-1 py-6 text-center sm:px-2">
          {!clockedIn && (
            <>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                Today&apos;s status
              </div>
              <div className="mt-2.5 text-[22px] font-semibold tracking-[-0.02em] text-neutral-900">
                You&apos;re ready to clock in.
              </div>
              <p className="mx-auto mt-1.5 max-w-[18rem] text-[13.5px] leading-relaxed text-neutral-500">
                Recording starts the moment you tap the button.
              </p>
            </>
          )}

          {clockedIn && !clockedOut && !justClockedIn && (
            <>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                Today&apos;s status
              </div>
              <div className="mt-2.5 flex justify-center">
                <StatusBadge value={att!.status} />
              </div>
              <p className="mx-auto mt-3 text-[14px] leading-relaxed text-neutral-600">
                Clocked in at{" "}
                <strong className="font-semibold tabular text-neutral-900">{timeOf(att!.clockIn)}</strong> — you&apos;re
                on the clock.
              </p>
            </>
          )}

          {(justClockedIn || justClockedOut) && (
            <div className="animate-fade-up">
              <div className="check-pop mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path
                    d="M5 13l4 4L19 7"
                    className="text-emerald-600"
                    style={{ strokeDasharray: 32, animation: "draw-check 0.45s 0.1s ease-out both" }}
                  />
                </svg>
              </div>
              <div className="mt-4 text-[22px] font-semibold tracking-[-0.02em] text-neutral-900">
                {justClockedIn ? "Clocked in" : "Clocked out"}
              </div>
              <div className="mt-1 text-[32px] font-semibold leading-none tracking-[-0.03em] tabular text-emerald-600">
                {timeOf(justClockedIn ? att?.clockIn : att?.clockOut)}
              </div>
              <p className="mt-3 text-[14px] text-neutral-500">
                {justClockedIn ? "Have a productive day." : "Great work today."}
              </p>
            </div>
          )}

          {clockedOut && !justClockedIn && !justClockedOut && (
            <>
              <div className="check-pop mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div className="mt-3 text-[19px] font-semibold tracking-[-0.02em] text-neutral-900">
                Shift complete
              </div>
              <p className="mt-1.5 text-[14px] text-neutral-500">
                Clocked out at <strong className="font-semibold tabular text-neutral-700">{timeOf(att?.clockOut)}</strong>
                {att?.totalMinutes ? ` · ${Math.floor(att.totalMinutes / 60)}h ${att.totalMinutes % 60}m worked` : ""}
              </p>
            </>
          )}

          {actionError && (
            <div
              role="alert"
              className="check-pop mx-auto mt-4 flex max-w-md items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-left text-[13.5px] font-medium text-red-700"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {actionError}
            </div>
          )}
        </div>

        <div className="border-t border-neutral-100 bg-neutral-50/60 px-5 py-4 sm:px-6">
          {!clockedIn && (
            <Button size="xl" className="w-full" loading={busy} onClick={() => clock("in")}>
              <Clock3 className="h-[18px] w-[18px]" />
              {busy ? "Recording…" : "Clock In"}
            </Button>
          )}
          {clockedIn && !clockedOut && (
            <Button size="xl" variant="success" className="w-full" loading={busy} onClick={() => clock("out")}>
              {busy ? "Recording…" : "Clock Out"}
            </Button>
          )}
          {clockedOut && (
            <p className="text-center text-[13.5px] text-neutral-500">
              Times are recorded by the server ({info.timezone}).
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Shared how-to + link opener ---------- */

function HowTo({ showOpener }: { showOpener: boolean }) {
  const router = useRouter();
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState("");

  function open(e: React.FormEvent) {
    e.preventDefault();
    const raw = link.trim();
    const match = raw.match(/\/attendance\/scan\/([^/?#\s]+)/);
    const token = match ? match[1] : raw;
    if (!/^[A-Za-z0-9_-]{8,}$/.test(token)) {
      setLinkError("Paste the full clock-in link from the QR, e.g. …/attendance/scan/chr_…");
      return;
    }
    setLinkError("");
    router.push(`/staff/clock?token=${encodeURIComponent(token)}`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <ScanLine className="h-4 w-4" />
          </span>
          How to clock in
        </CardTitle>
        <CardDescription>Three steps, a few seconds.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 md:grid-cols-2">
        <ol className="space-y-3">
          {[
            "Find the printed ChronoSwift QR code at your entrance.",
            "Point your phone camera at it and open the link.",
            "Tap Clock In — attendance is recorded instantly.",
          ].map((s, i) => (
            <li key={s} className="flex items-start gap-3 text-[13.5px] leading-relaxed text-neutral-600">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-[11px] font-semibold tabular text-white">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>

        {showOpener && (
          <form onSubmit={open} className="h-fit rounded-xl border border-neutral-200 bg-neutral-50/70 p-4">
            <Label htmlFor="clock-link">Have the QR link?</Label>
            <div className="mt-1 flex gap-2">
              <Input
                id="clock-link"
                className="min-w-0"
                value={link}
                onChange={(e) => {
                  setLink(e.target.value);
                  if (linkError) setLinkError("");
                }}
                placeholder="…/attendance/scan/chr_…"
                aria-describedby="clock-link-hint"
              />
              <Button type="submit" className="shrink-0">
                Open <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <Hint>
              <span id="clock-link-hint">
                Paste the URL from the code your administrator shared — this opens the same clock-in screen as scanning.
              </span>
            </Hint>
            <FieldError message={linkError} />
          </form>
        )}
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
