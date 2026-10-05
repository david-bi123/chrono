"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Label, FieldError, PasswordInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/auth/auth-shell";
import { Spinner } from "@/components/ui/states";
import { Building2, Mail, Lock, AlertCircle } from "lucide-react";

export default function AcceptPage() {
  return (
    <Suspense>
      <AcceptInner />
    </Suspense>
  );
}

function AcceptInner() {
  const search = useSearchParams();
  const router = useRouter();
  const token = search.get("token") || "";
  const [info, setInfo] = useState<{ email: string; orgName: string; type: string } | null>(null);
  const [err, setErr] = useState("");
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setErr("Missing invitation token");
      setChecking(false);
      return;
    }
    fetch(`/api/auth/accept-invitation?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) setErr(d.error || "Invalid invitation");
        else setInfo(d);
      })
      .catch(() => setErr("Network error"))
      .finally(() => setChecking(false));
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/accept-invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const d = await res.json();
      if (!res.ok) {
        setErr(d.error || "Setup failed");
        return;
      }
      router.push("/login?invited=1");
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (checking && !info) {
    return (
      <AuthShell title="Validating invitation" subtitle="Checking your single-use setup link…">
        <div className="mt-8 flex items-center gap-3 text-[14px] text-neutral-500">
          <Spinner /> Just a moment…
        </div>
      </AuthShell>
    );
  }

  if (err && !info) {
    return (
      <AuthShell
        title="Invitation unavailable"
        subtitle="This link may have expired or already been used."
        footer={
          <Link href="/login" className="inline-flex items-center gap-1.5 font-medium text-neutral-700 hover:text-neutral-900">
            Back to sign in
          </Link>
        }
      >
        <div
          role="alert"
          className="mt-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-[13.5px] leading-snug text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{err}</span>
        </div>
        <p className="mt-4 text-[13.5px] leading-relaxed text-neutral-500">
          Ask your administrator to send a new invitation — every link is single-use and time-limited.
        </p>
      </AuthShell>
    );
  }

  if (!info) return null;

  return (
    <AuthShell
      title="Set up your account"
      subtitle={`Join ${info.orgName} and choose the password you'll sign in with.`}
      footer={
        <span className="text-neutral-500">Invited as {info.email}</span>
      }
    >
      <div className="mt-5 space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3.5 text-[13px] text-neutral-600">
        <div className="flex items-center gap-2.5">
          <Building2 className="h-4 w-4 text-neutral-500" />
          <span className="font-medium text-neutral-800">{info.orgName}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Mail className="h-4 w-4 text-neutral-500" />
          <span>{info.email}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Lock className="h-4 w-4 text-neutral-500" />
          <span>Role: {info.type === "ORGANIZATION_ADMIN" ? "Organization administrator" : "Staff"}</span>
        </div>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="pw">Create password</Label>
          <PasswordInput
            id="pw"
            autoComplete="new-password"
            placeholder="Min 8 chars, upper + lower + number"
            className="h-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
          />
        </div>
        <FieldError message={err} />
        <Button className="w-full" size="lg" loading={loading} type="submit">
          {loading ? "Activating…" : "Activate account"}
        </Button>
        <p className="text-center text-[11.5px] text-neutral-500">
          This link is single-use and expires. Never share it.
        </p>
      </form>
    </AuthShell>
  );
}
