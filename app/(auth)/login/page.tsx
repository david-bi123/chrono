"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, QrCode, BarChart3 } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Sign in failed");
        return;
      }
      router.push(next || data.redirectTo || "/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-neutral-950 p-10 text-white lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(500px_300px_at_20%_0%,rgba(255,255,255,0.09),transparent)]" />
        <div className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[17px] text-neutral-900">◷</div>
          <span className="text-[16px] font-bold tracking-tight">ChronoSwift</span>
        </div>
        <div className="relative">
          <h2 className="max-w-md text-balance text-3xl font-bold leading-tight tracking-tight">
            Attendance management, without the paperwork.
          </h2>
          <ul className="mt-8 space-y-4">
            {[
              [QrCode, "Scan a QR, tap Clock In — done in seconds"],
              [BarChart3, "Live dashboards, late detection and CSV reports"],
              [ShieldCheck, "Isolated tenants, hashed tokens, full audit trail"],
            ].map(([Icon, t]) => {
              const I = Icon as typeof QrCode;
              return (
                <li key={t as string} className="flex items-center gap-3 text-[14px] text-neutral-300">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10"><I className="h-[18px] w-[18px]" /></span>
                  {t as string}
                </li>
              );
            })}
          </ul>
        </div>
        <p className="relative text-xs text-neutral-500">Smart attendance. Simple management.</p>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center bg-[#F6F7F9] px-4 py-10 sm:px-8">
        <Card className="w-full max-w-[400px] p-2">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-white">◷</div>
              <span className="font-bold">ChronoSwift</span>
            </div>
            <h1 className="mt-4 text-xl font-bold tracking-tight lg:mt-0">Welcome back</h1>
            <p className="mt-1 text-[13.5px] text-neutral-500">Sign in to your workspace.</p>
            <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
              <div>
                <Label htmlFor="email">Work email</Label>
                <Input id="email" type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="password" className="text-[13px] font-semibold text-neutral-700">Password</label>
                  <Link href="/forgot-password" className="text-[13px] font-medium text-neutral-500 hover:text-neutral-900">Forgot?</Link>
                </div>
                <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <FieldError message={error} />
              <Button className="w-full" size="lg" loading={loading} type="submit">
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>
            <div className="mt-6 border-t border-neutral-100 pt-4 text-center text-[13px] text-neutral-500">
              <Link href="/" className="font-medium hover:text-neutral-900">← Back home</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
