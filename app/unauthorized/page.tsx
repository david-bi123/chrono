import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";

export default function Unauthorized() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F8FA] px-4 py-12">
      <div className="mb-8">
        <Logo size="lg" />
      </div>

      <div className="w-full max-w-[420px] rounded-2xl border border-neutral-200/80 bg-white p-7 text-center shadow-card sm:p-9">
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

      <p className="mt-6 text-[13px] text-neutral-500">Smart attendance. Simple management.</p>
    </div>
  );
}
