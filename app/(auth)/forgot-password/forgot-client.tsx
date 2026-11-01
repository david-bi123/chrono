"use client";
import { useState } from "react";
import Link from "next/link";
import { Input, Label, FormAlert } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/auth/auth-shell";
import { SpamNotice } from "@/components/ui/spam-notice";
import { CheckCircle2, ArrowLeft } from "lucide-react";

export default function ForgotClient() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        setError("We couldn't send the reset link. Please try again.");
        return;
      }
      // The response is deliberately identical for registered and unknown
      // addresses — we never reveal whether an account exists.
      setDone(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={done ? "Check your inbox" : "Reset your password"}
      subtitle={
        done
          ? "If an account exists for that address, a reset link is on its way."
          : "We'll email you a secure link that's valid for 60 minutes."
      }
      footer={
        <Link href="/login" className="inline-flex items-center gap-1.5 font-medium text-neutral-700 hover:text-neutral-900">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Back to sign in
        </Link>
      }
    >
      {done ? (
        <div className="mt-6 space-y-4">
          <div
            role="status"
            className="flex items-start gap-2.5 rounded-lg border border-brand-200 bg-brand-50 px-3.5 py-3 text-sm leading-snug text-brand-800"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              We sent a reset link to <span className="font-semibold">{email}</span> if it&apos;s registered. It
              expires in 60 minutes.
            </span>
          </div>
          <SpamNotice email={email} />
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              setDone(false);
              setEmail("");
            }}
          >
            Use a different email
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <FormAlert message={error} />
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
          <Button className="w-full" size="lg" loading={loading} type="submit">
            {loading ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
