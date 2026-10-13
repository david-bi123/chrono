"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogoMark } from "@/components/brand/logo";
import { LogIn, MapPin, AlertTriangle, ArrowRight } from "lucide-react";

interface ScanInfo {
  orgName: string;
  locationName: string;
  display: { displayDate: string; displayTime: string };
  timezone: string;
  authenticated: boolean;
  sessionEmail: string | null;
  belongs: boolean;
  role: string | null;
  attendance: { clockIn?: string; clockOut?: string; status: string; totalMinutes?: number } | null;
  error?: string;
}

/**
 * QR entry point. This screen only handles pre-dashboard states:
 * loading, invalid codes, sign-in prompts and wrong-organization accounts.
 * Anyone cleared to clock in is handed straight to the dashboard clock
 * page (/staff/clock?token=…) — the canonical, navigable experience.
 * Printed QR codes keep working unchanged; no reprints needed.
 */
export default function ScanPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [info, setInfo] = useState<ScanInfo | null>(null);
  const [error, setError] = useState("");

  const clockHref = `/staff/clock?token=${encodeURIComponent(params.token)}`;

  useEffect(() => {
    fetch(`/api/attendance/scan/${encodeURIComponent(params.token)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) setError(d.error || "This QR code isn't valid.");
        else setInfo(d);
      })
      .catch(() => setError("We couldn't reach ChronoSwift. Check your connection and try again."));
  }, [params.token]);

  useEffect(() => {
    if (info?.authenticated && info?.belongs) {
      router.replace(clockHref);
    }
  }, [info, clockHref, router]);

  const homeHref =
    info?.role === "ORGANIZATION_ADMIN"
      ? "/dashboard"
      : info?.role === "SUPER_ADMIN"
        ? "/super-admin"
        : "/staff";

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
            Your scan worked — sign in to open your dashboard and record attendance for {info.display.displayDate}.
          </p>
          <Link
            href={`/login?next=${encodeURIComponent(clockHref)}`}
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
          {info.sessionEmail && (
            <p className="mt-2 text-[13px] text-neutral-500">
              You&apos;re signed in as <span className="font-medium text-neutral-700">{info.sessionEmail}</span>.
            </p>
          )}
          <Link
            href={`/login?next=${encodeURIComponent(clockHref)}`}
            className="mt-5 block rounded-xl bg-brand-600 px-4 py-3.5 text-center text-[15px] font-semibold text-white shadow-xs transition hover:bg-brand-700 active:translate-y-px"
          >
            Switch account
          </Link>
          <Link
            href={homeHref}
            className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand-600 hover:underline"
          >
            Go to my day <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Shell>
    );
  }

  // Cleared to clock in — hand off to the dashboard clock page.
  return (
    <Shell>
      <div className="w-full max-w-sm space-y-3" aria-busy="true" aria-live="polite">
        <div className="skeleton mx-auto h-6 w-48 rounded-lg" />
        <div className="skeleton h-12 w-full" />
        <span className="sr-only">Opening your dashboard…</span>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center bg-[#F5F6F8] px-4 py-8 sm:py-12">
      <div className="flex w-full max-w-md items-center justify-center gap-2.5">
        <LogoMark className="h-8 w-8" />
        <span className="text-[17px] font-semibold tracking-[-0.02em] text-neutral-900">ChronoSwift</span>
      </div>
      <div className="mt-8 flex w-full flex-col items-center">{children}</div>
    </div>
  );
}
