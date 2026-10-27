import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";

export default function Unauthorized() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-neutral-50 px-4 py-12">
      <div className="pointer-events-none absolute inset-0 opacity-[0.55]" aria-hidden>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.045)_1px,transparent_1px)] bg-[length:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,black,transparent)]" />
        <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(640px_240px_at_50%_-70px,rgba(16,185,129,0.10),transparent)]" />
      </div>
      <div className="relative mb-8">
        <Logo size="lg" />
      </div>

      <div className="relative w-full max-w-[420px] rounded-2xl border border-neutral-200/80 bg-white p-7 text-center shadow-card sm:p-9">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <ShieldAlert className="h-7 w-7 text-amber-600" aria-hidden />
        </div>
        <div className="mt-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-amber-600">403</div>
        <h1 className="mt-1.5 text-[20px] font-semibold tracking-[-0.02em] text-neutral-900">
          You don&apos;t have access to this page
        </h1>
        <p className="mx-auto mt-2 max-w-[300px] text-[14px] leading-relaxed text-neutral-500">
          Your account role doesn&apos;t include this area. If you think that&apos;s wrong, ask your administrator to
          update your permissions.
        </p>
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link href="/login">
            <Button className="w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4" /> Back to sign in
            </Button>
          </Link>
          <Link href="/">
            <Button variant="secondary" className="w-full sm:w-auto">
              <Home className="h-4 w-4" /> Homepage
            </Button>
          </Link>
        </div>
      </div>

      <p className="relative mt-6 text-sm text-neutral-500">Smart attendance. Simple management.</p>
    </div>
  );
}
