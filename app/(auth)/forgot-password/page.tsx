"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SpamNotice } from "@/components/ui/spam-notice";

export default function ForgotPage() {
  return (
    <Suspense>
      <ForgotInner />
    </Suspense>
  );
}

function ForgotInner() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setDone(true);
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>We&apos;ll email you a reset link if the account exists.</CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="space-y-3 text-sm text-neutral-600">
              <p>
                If an account exists for <strong>{email}</strong>, a reset link is on its way (valid 60 minutes).
              </p>
              <SpamNotice email={email} />
              <div><Link href="/login" className="font-medium text-neutral-900 underline">Back to sign in</Link></div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
              <Button className="w-full" disabled={loading}>{loading ? "Sending…" : "Send reset link"}</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
