"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setErr("Missing invitation token");
      return;
    }
    fetch(`/api/auth/accept-invitation?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) setErr(d.error || "Invalid invitation");
        else setInfo(d);
      })
      .catch(() => setErr("Network error"));
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white">◷</div>
            <CardTitle className="text-base">ChronoSwift</CardTitle>
          </div>
          <CardDescription>{info ? `Join ${info.orgName} as ${info.email}` : "Accept invitation"}</CardDescription>
        </CardHeader>
        <CardContent>
          {err && !info ? (
            <div className="text-sm text-red-600">{err}<div className="mt-3"><Link href="/login" className="underline text-neutral-900">Back to sign in</Link></div></div>
          ) : !info ? (
            <div className="text-sm text-neutral-500">Validating invitation…</div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div><Label htmlFor="pw">Create password</Label><Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Min 8 chars, upper + lower + number" /></div>
              <FieldError message={err} />
              <Button className="w-full" disabled={loading}>{loading ? "Activating…" : "Activate account"}</Button>
              <p className="text-[11px] text-neutral-500">Link is single-use and expires. Never share it.</p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
