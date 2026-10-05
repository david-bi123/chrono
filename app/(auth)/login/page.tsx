"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input, Label, FieldError, PasswordInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/auth/auth-shell";
import { CheckCircle2, X } from "lucide-react";

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
  const invited = search.get("invited");
  const reset = search.get("reset");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState(
    invited
      ? "Your account is set up — sign in with your new password."
      : reset
        ? "Password updated — sign in with your new password."
        : ""
  );

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
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your ChronoSwift workspace."
      footer={
        <>
          Need an account? Your administrator invites you by email.{" "}
          <Link href="/" className="font-medium text-brand-600 hover:underline">
            Learn more
          </Link>
        </>
      }
    >
      {banner && (
        <div
          role="status"
          className="mt-5 flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-[13.5px] text-emerald-800"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1 leading-snug">{banner}</div>
          <button onClick={() => setBanner("")} aria-label="Dismiss" className="text-emerald-500 hover:text-emerald-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <div>
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className="h-10"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label htmlFor="password" className="mb-0">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-[13px] font-medium text-neutral-500 transition hover:text-neutral-900"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <FieldError message={error} />
        <Button className="w-full" size="lg" loading={loading} type="submit">
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}
