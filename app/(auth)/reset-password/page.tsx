"use client";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Label, FieldError, PasswordInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/auth/auth-shell";
import { Sparkles } from "lucide-react";

const RULES = ["At least 8 characters", "An uppercase and a lowercase letter", "At least one number"];

export default function ResetPage() {
  return (
    <Suspense>
      <ResetInner />
    </Suspense>
  );
}

function ResetInner() {
  const search = useSearchParams();
  const router = useRouter();
  const token = search.get("token") || "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Reset failed");
        return;
      }
      router.push("/login?reset=1");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthShell
        title="Link missing"
        subtitle="This reset link is incomplete or was never opened correctly."
        footer={
          <Link href="/forgot-password" className="font-medium text-brand-600 hover:underline">
            Request a new link
          </Link>
        }
      >
        <p className="mt-5 text-[14px] leading-relaxed text-neutral-600">
          Request a fresh reset link and open it directly in this browser.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create a new password"
      subtitle="Choose a strong password for your ChronoSwift account."
      footer={
        <Link href="/login" className="inline-flex items-center gap-1.5 font-medium text-neutral-700 hover:text-neutral-900">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="pw">New password</Label>
          <PasswordInput
            id="pw"
            autoComplete="new-password"
            className="h-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
          />
        </div>

        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px] text-neutral-500">
          {RULES.map((r) => (
            <li key={r} className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-brand-500" />
              {r}
            </li>
          ))}
        </ul>

        <FieldError message={error} />

        <Button className="w-full" size="lg" loading={loading} type="submit">
          {loading ? "Saving…" : "Reset password"}
        </Button>
      </form>
    </AuthShell>
  );
}
