"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, LogIn, MapPin } from "lucide-react";

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

export default function ScanPage({ params }: { params: { token: string } }) {
  const [info, setInfo] = useState<ScanInfo | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch(`/api/attendance/scan/${encodeURIComponent(params.token)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) setError(d.error || "Invalid QR");
        else setInfo(d);
      })
      .catch(() => setError("Network error"));
  }, [params.token]);

  async function clock(mode: "in" | "out") {
    setBusy(true);
    setMsg("");
    try {
      const r = await fetch(`/api/attendance/clock?mode=${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationToken: params.token }),
      });
      const d = await r.json();
      if (!r.ok) {
        setMsg(d.error || "Failed");
      } else {
        setMsg(mode === "in" ? `Clocked in · ${new Date(d.attendance.clockIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Clocked out — great work today");
        const r2 = await fetch(`/api/attendance/scan/${encodeURIComponent(params.token)}`);
        const d2 = await r2.json();
        if (r2.ok) setInfo(d2);
      }
    } catch {
      setMsg("Network error");
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F7F9] px-4">
        <Card className="w-full max-w-sm"><CardContent className="p-8 text-center"><div className="text-base font-bold">QR unavailable</div><p className="mt-1 text-sm text-neutral-500">{error}</p></CardContent></Card>
      </div>
    );
  }
  if (!info) return <div className="flex min-h-screen items-center justify-center bg-[#F6F7F9] px-4"><div className="skeleton h-72 w-full max-w-sm" /></div>;

  if (!info.authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F7F9] px-4 py-10">
        <Card className="w-full max-w-sm">
          <CardContent className="p-7 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 text-white"><LogIn className="h-5 w-5" /></div>
            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs font-medium text-neutral-500"><MapPin className="h-3.5 w-3.5" />{info.orgName} · {info.locationName}</div>
            <div className="mt-2 text-xl font-bold tracking-tight">Sign in to clock in</div>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">Scan worked — sign in to record attendance for {info.display.displayDate}.</p>
            <Link href={`/login?next=${encodeURIComponent(`/attendance/scan/${params.token}`)}`} className="mt-5 block rounded-2xl bg-neutral-900 px-4 py-3.5 text-center text-sm font-semibold text-white">Sign in</Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!info.belongs) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F7F9] px-4">
        <Card className="w-full max-w-sm"><CardContent className="p-7 text-center text-sm">This QR belongs to <strong>{info.orgName}</strong>, which your account cannot access.</CardContent></Card>
      </div>
    );
  }

  const att = info.attendance;
  const clockedIn = Boolean(att?.clockIn);
  const clockedOut = Boolean(att?.clockOut);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[#F6F7F9] px-4 py-8 sm:py-12">
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-600">
          <MapPin className="h-3.5 w-3.5" /> {info.orgName} · {info.locationName}
        </div>
        <div className="mt-4 text-5xl font-bold tabular-nums tracking-tight sm:text-6xl">{info.display.displayTime}</div>
        <div className="mt-1.5 text-sm font-medium text-neutral-500">{info.display.displayDate}</div>
      </div>

      <Card className="mt-6">
        <CardContent className="p-6 text-center sm:p-7">
          {clockedOut ? (
            <div className="check-pop mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 className="h-7 w-7" /></div>
          ) : (
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-400">Today&apos;s status</div>
          )}
          <div className="mt-2 flex justify-center">{att ? <Badge value={att.status} /> : <span className="text-sm font-medium text-neutral-500">Not clocked in</span>}</div>

          {clockedIn && !clockedOut && (
            <p className="mt-3 text-sm text-neutral-600">
              Clocked in at <strong className="tabular-nums">{new Date(att!.clockIn!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</strong> — you&apos;re on the clock.
            </p>
          )}
          {clockedOut && <p className="mt-2 text-sm text-neutral-500">Shift complete. Have a great evening.</p>}
          {msg && <p className="check-pop mt-3 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-700">{msg}</p>}

          <div className="mt-5">
            {!clockedIn && <Button size="xl" className="w-full text-base" loading={busy} onClick={() => clock("in")}>{busy ? "Recording…" : "Clock In"}</Button>}
            {clockedIn && !clockedOut && <Button size="xl" variant="success" className="w-full text-base" loading={busy} onClick={() => clock("out")}>{busy ? "Recording…" : "Clock Out"}</Button>}
            {clockedOut && <Link href="/staff" className="block rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-center text-sm font-semibold">View my day</Link>}
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-neutral-400">Time is recorded by the server ({info.timezone}).<br />Do not rely on screenshots of this page.</p>
        </CardContent>
      </Card>
    </div>
  );
}
