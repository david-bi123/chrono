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
    <div className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-neutral-950 p-10 text-white lg:flex xl:p-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_380px_at_15%_-10%,rgba(65,102,245,0.22),transparent_70%)]" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-brand-600/10 blur-3xl" />

        <div className="relative">
          <Logo tone="light" size="lg" />
        </div>

        <div className="relative max-w-md">
          <h2 className="text-balance text-[32px] font-semibold leading-[1.15] tracking-[-0.03em]">
            Attendance management, without the paperwork.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-neutral-400">
            ChronoSwift records when your team arrives and leaves — server-side, tamper-proof, and ready for payroll.
          </p>
          <ul className="mt-8 space-y-4">
            {POINTS.map((p) => (
              <li key={p.text} className="flex items-start gap-3 text-[14px] text-neutral-300">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.07] ring-1 ring-white/10">
                  <p.icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="leading-relaxed">{p.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-2 text-[13px] text-neutral-500">
          <Check className="h-3.5 w-3.5 text-emerald-400" />
          Smart attendance. Simple management.
        </div>
      </aside>

      {/* Form */}
      <main className="flex items-center justify-center bg-[#F7F8FA] px-4 py-10 sm:px-8 sm:py-14">
        <div className="w-full max-w-[420px]">
          <div className="mb-7 flex items-center justify-center lg:hidden">
            <Logo size="lg" />
          </div>

          <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-card sm:p-8">
            <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-neutral-900">{title}</h1>
            <p className="mt-1.5 text-[14px] leading-relaxed text-neutral-500">{subtitle}</p>
            {children}
          </div>

          {footer && <div className="mt-5 text-center text-[13.5px] text-neutral-500">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
