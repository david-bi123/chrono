"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScanLine, ArrowRight, Clock3, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError, Hint } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { formatMinutes } from "@/lib/utils";

type Today = {
  date?: string;
  clockIn?: string;
  clockOut?: string;
  totalMinutes?: number;
  status: string;
} | null;

const timeOf = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

export default function ClockPage() {
  const router = useRouter();
  const [today, setToday] = useState<Today>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState("");

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
    router.push(`/attendance/scan/${encodeURIComponent(token)}`);
  }

  if (error && !loaded) return <ErrorState message={error} onRetry={load} />;

  const clockedIn = Boolean(today?.clockIn);
  const clockedOut = Boolean(today?.clockOut);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clock in & out"
        description="Record your attendance by scanning your organization's QR code. Times are stamped by the server the moment you tap."
      />

      {/* Today's status */}
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
            {loaded && today && (
              <StatusBadge value={today.status} pulse={!clockedOut} />
            )}
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

      {/* How it works + link opener */}
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

          <form
            onSubmit={open}
            className="h-fit rounded-xl border border-neutral-200 bg-neutral-50/70 p-4"
          >
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
        </CardContent>
      </Card>
    </div>
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
