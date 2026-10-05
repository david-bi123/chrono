"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { LogoMark } from "@/components/brand/logo";
import { CheckCircle2, LogIn, MapPin, AlertTriangle, ArrowRight, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScanInfo {
  orgName: string;
  locationName: string;
  display: { displayDate: string; displayTime: string };
  timezone: string;
  authenticated: boolean;
  belongs: boolean;
  role: string | null;
  attendance: { clockIn?: string; clockOut?: string; status: string; totalMinutes?: number } | null;
  error?: string;
}

const timeOf = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

export default function ScanPage({ params }: { params: { token: string } }) {
  const [info, setInfo] = useState<ScanInfo | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [flash, setFlash] = useState<"in" | "out" | null>(null);

  useEffect(() => {
    fetch(`/api/attendance/scan/${encodeURIComponent(params.token)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) setError(d.error || "This QR code isn't valid.");
        else setInfo(d);
      })
      .catch(() => setError("We couldn't reach Chrono. Check your connection and try again."));
  }, [params.token]);

  async function clock(mode: "in" | "out") {
    setBusy(true);
    setActionError("");
    try {
      const r = await fetch(`/api/attendance/clock?mode=${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationToken: params.token }),
      });
      const d = await r.json();
      if (!r.ok) {
        setActionError(d.error || "We couldn't record that. Please try again.");
        return;
      }
      setFlash(mode);
      const r2 = await fetch(`/api/attendance/scan/${encodeURIComponent(params.token)}`);
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
      <Shell>
        <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-7 text-center shadow-card">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="mt-4 text-[17px] font-semibold tracking-tight text-neutral-900">QR unavailable</div>
          <p className="mt-1.5 text-[14px] leading-relaxed text-neutral-500">{error}</p>
          <p className="mt-4 text-[12.5px] text-neutral-500">
            If this code was printed a while ago, ask your administrator for a fresh one.
          </p>
        </div>
      </Shell>
    );
  }

  if (!info) {
    return (
      <Shell>
        <div className="w-full max-w-sm space-y-3" aria-busy="true" aria-live="polite">
          <div className="skeleton h-6 w-40 rounded-lg" />
          <div className="skeleton h-12 w-full" />
          <div className="skeleton h-52 w-full" />
          <span className="sr-only">Loading clock-in details…</span>
        </div>
      </Shell>
    );
  }

  if (!info.authenticated) {
    return (
      <Shell>
        <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-7 text-center shadow-card">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <LogIn className="h-5 w-5" />
          </div>
          <div className="mt-4 flex items-center justify-center gap-1.5 text-[12.5px] font-medium text-neutral-500">
            <MapPin className="h-3.5 w-3.5" />
            {info.orgName} · {info.locationName}
          </div>
          <div className="mt-2 text-xl font-semibold tracking-[-0.02em] text-neutral-900">Sign in to clock in</div>
          <p className="mt-2 text-[14px] leading-relaxed text-neutral-500">
            Your scan worked — sign in so we can record attendance for {info.display.displayDate}.
          </p>
          <Link
            href={`/login?next=${encodeURIComponent(`/attendance/scan/${params.token}`)}`}
            className="mt-5 block rounded-xl bg-brand-600 px-4 py-3.5 text-center text-[15px] font-semibold text-white shadow-xs transition hover:bg-brand-700 active:translate-y-px"
          >
            Sign in
          </Link>
        </div>
      </Shell>
    );
  }

  if (!info.belongs) {
    return (
      <Shell>
        <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-7 text-center shadow-card">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="mt-4 text-[17px] font-semibold tracking-tight text-neutral-900">This code isn&apos;t for you</div>
          <p className="mt-1.5 text-[14px] leading-relaxed text-neutral-500">
            It belongs to <strong className="font-semibold text-neutral-800">{info.orgName}</strong>, which your
            account can&apos;t access.
          </p>
          <Link
            href="/staff"
            className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand-600 hover:underline"
          >
            Go to my day <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Shell>
    );
  }

  const att = info.attendance;
  const clockedIn = Boolean(att?.clockIn);
  const clockedOut = Boolean(att?.clockOut);
  const justClockedIn = flash === "in" && clockedIn && !clockedOut;
  const justClockedOut = flash === "out" && clockedOut;

  return (
    <Shell>
      <div className="w-full max-w-md">
        {/* Location */}
        <div className="flex justify-center">
          <span className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-neutral-600 shadow-xs">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-500" />
            <span className="truncate">{info.orgName}</span>
            <span className="text-neutral-300">·</span>
            <span className="truncate font-semibold text-neutral-800">{info.locationName}</span>
          </span>
        </div>

        {/* Clock */}
        <div className="mt-7 text-center">
          <div className="text-[13px] font-medium uppercase tracking-[0.16em] text-neutral-500">
            {info.display.displayDate}
          </div>
          <div className="mt-2 text-[56px] font-semibold leading-none tracking-[-0.04em] tabular text-neutral-900 sm:text-[64px]">
            {info.display.displayTime}
          </div>
        </div>

        {/* Status card */}
        <div className="mt-7 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-card">
          <div className="px-5 py-6 text-center sm:px-6">
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
                className="check-pop mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-left text-[13.5px] font-medium text-red-700"
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
              <Link
                href="/staff"
                className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white text-[15px] font-semibold text-neutral-800 shadow-xs transition hover:bg-neutral-50"
              >
                View my day <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>

        <p className="mt-5 text-center text-[11.5px] leading-relaxed text-neutral-500">
          Times are recorded by the server ({info.timezone}).
          <br />
          Screenshots of this page don&apos;t record attendance.
        </p>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-[#F5F6F8] px-4 py-8 sm:py-12">
      <div className="flex w-full max-w-md items-center justify-center gap-2.5">
        <LogoMark className="h-8 w-8" />
        <span className={cn("text-[17px] font-semibold tracking-[-0.02em] text-neutral-900")}>Chrono</span>
      </div>
      <div className="mt-8 flex w-full flex-col items-center">{children}</div>
    </div>
  );
}
