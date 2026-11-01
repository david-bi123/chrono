import { Logo } from "@/components/brand/logo";
import { QrCode, BarChart3, ShieldCheck, Check } from "lucide-react";

const POINTS = [
  { icon: QrCode, text: "Scan a QR code, tap Clock In — done in seconds" },
  { icon: BarChart3, text: "Live dashboards, late detection and CSV reports" },
  { icon: ShieldCheck, text: "Isolated tenants, hashed tokens, full audit trail" },
];

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh bg-white lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-neutral-200/70 bg-gradient-to-b from-white to-brand-50 p-10 lg:flex xl:p-12">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(57,118,90,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(57,118,90,0.06)_1px,transparent_1px)] bg-[length:48px_48px] [mask-image:radial-gradient(ellipse_80%_70%_at_30%_20%,black_30%,transparent_100%)]" />
          <div className="absolute inset-x-0 bottom-[-140px] h-[540px] bg-[radial-gradient(640px_500px_at_50%_100%,rgba(77,143,111,0.12),transparent_70%)]" />
          <div className="absolute -bottom-28 -left-16 h-80 w-80 rounded-full bg-brand-100/70 blur-3xl" />
          <div className="absolute -right-20 bottom-1/3 h-64 w-64 rounded-full bg-brand-50 blur-3xl" />
        </div>

        <div className="relative">
          <Logo size="lg" />
        </div>

        <div className="relative max-w-md">
          <h2 className="font-display text-balance text-[32px] font-bold leading-[1.15] tracking-[-0.03em] text-neutral-900">
            Attendance management, without the paperwork.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-neutral-600">
            ChronoSwift records when your team arrives and leaves — server-side, tamper-proof, and ready for payroll.
          </p>
          <ul className="mt-8 space-y-4">
            {POINTS.map((p) => (
              <li key={p.text} className="flex items-start gap-3 text-[14px] text-neutral-700">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-brand-600 ring-1 ring-brand-200 shadow-xs">
                  <p.icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="leading-relaxed">{p.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-2 text-sm text-neutral-500">
          <Check className="h-3.5 w-3.5 text-brand-600" />
          Smart attendance. Simple management.
        </div>
      </aside>

      {/* Form */}
      <main className="relative flex items-center justify-center overflow-hidden bg-background px-4 py-10 sm:px-8 sm:py-14">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(45,110,84,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(45,110,84,0.05)_1px,transparent_1px)] bg-[length:40px_40px] opacity-[0.6] [mask-image:radial-gradient(ellipse_60%_55%_at_50%_28%,black,transparent)]" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(640px_240px_at_50%_-70px,rgba(77,143,111,0.13),transparent)]" aria-hidden />
        <div className="relative w-full max-w-[420px]">
          <div className="mb-7 flex items-center justify-center lg:hidden">
            <Logo size="lg" />
          </div>

          <div className="relative rounded-2xl border border-neutral-200/80 bg-card p-6 shadow-card sm:p-8">
            <h1 className="font-display text-[22px] font-bold tracking-[-0.02em] text-neutral-900">{title}</h1>
            <p className="mt-1.5 text-[14px] leading-relaxed text-neutral-500">{subtitle}</p>
            <div className="mt-2 mb-0 h-1 w-10 rounded-full bg-brand-600" aria-hidden />
            <div className="mt-4">{children}</div>
          </div>

          {footer && <div className="mt-5 text-center text-sm text-neutral-500">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
