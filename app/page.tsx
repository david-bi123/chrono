import Link from "next/link";
import { QrCode, Users, BarChart3, ShieldCheck, Clock, BellRing } from "lucide-react";

const features = [
  { icon: QrCode, title: "QR clock-in", desc: "One QR per entrance. Staff scan, tap Clock In — timestamps are recorded server-side, never from the phone clock." },
  { icon: Clock, title: "Late & absence detection", desc: "Per-organization start times, grace periods, working days and timezones. Defaults to Africa/Accra." },
  { icon: Users, title: "Staff management", desc: "Email invitations with single-use secure links, departments, disable/reactivate, and resend with throttling." },
  { icon: BarChart3, title: "Reports & exports", desc: "Filter by date, status, staff or search. Server-generated CSV exports for payroll and audits." },
  { icon: ShieldCheck, title: "Tenant isolation", desc: "Every record carries an organizationId enforced on the server. Org A can never see Org B — not just hidden in UI." },
  { icon: BellRing, title: "Audit trail", desc: "Invitations, QR rotations, corrections and settings changes are logged with actor, IP and timestamp." },
];

const steps = [
  ["Create your organization", "Super admin provisions your tenant. Your admin gets a secure 72-hour setup link by email — no passwords in email, ever."],
  ["Invite staff & print QR", "Invite the team, create locations like Reception or Warehouse. Each gets its own revocable QR to print."],
  ["Scan, clock in, report", "Staff scan with any phone camera and tap Clock In. Admins watch live dashboards and export reports."],
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-[17px] text-white">◷</div>
            <span className="text-[16px] font-bold tracking-tight">Chrono</span>
          </div>
          <nav className="hidden items-center gap-7 text-[13.5px] font-medium text-neutral-500 md:flex">
            <a href="#features" className="transition hover:text-neutral-900">Features</a>
            <a href="#how" className="transition hover:text-neutral-900">How it works</a>
            <a href="#security" className="transition hover:text-neutral-900">Security</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-xl px-3.5 py-2 text-sm font-semibold text-neutral-600 transition hover:text-neutral-900">
              Sign in
            </Link>
            <Link href="/login" className="rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-neutral-800 active:scale-[0.98]">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_300px_at_50%_-60px,rgba(11,15,25,0.08),transparent)]" />
          <div className="mx-auto max-w-6xl px-4 pb-14 pt-14 text-center sm:px-6 sm:pt-20">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 py-1.5 pl-2 pr-3.5 text-xs font-semibold text-neutral-600">
              <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">New</span>
              Multi-tenant attendance for modern teams
            </div>
            <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-bold leading-[1.05] tracking-[-0.03em] sm:text-5xl md:text-6xl">
              Attendance management, without the paperwork.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-balance text-[15px] leading-relaxed text-neutral-500 sm:text-base">
              Track when your team arrives, leaves, and works — all from one simple platform. Print a QR, scan, done.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/login" className="w-full rounded-2xl bg-neutral-900 px-7 py-3.5 text-sm font-semibold text-white shadow-lift transition hover:bg-neutral-800 active:scale-[0.98] sm:w-auto">
                Get started free
              </Link>
              <a href="#how" className="w-full rounded-2xl border border-neutral-200 bg-white px-7 py-3.5 text-sm font-semibold text-neutral-700 shadow-soft transition hover:bg-neutral-50 sm:w-auto">
                See how it works
              </a>
            </div>

            {/* Product mock */}
            <div className="mx-auto mt-12 max-w-4xl rounded-2xl border border-neutral-200 bg-white p-2 shadow-lift sm:mt-16">
              <div className="overflow-hidden rounded-xl border border-neutral-100 bg-[#F8FAFC]">
                <div className="flex items-center gap-1.5 border-b border-neutral-100 bg-white px-4 py-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-neutral-200" />
                  <span className="h-2.5 w-2.5 rounded-full bg-neutral-200" />
                  <span className="h-2.5 w-2.5 rounded-full bg-neutral-200" />
                  <span className="ml-3 hidden rounded-md bg-neutral-100 px-3 py-1 font-mono text-[11px] text-neutral-500 sm:block">chrono.app/dashboard</span>
                </div>
                <div className="grid gap-3 p-3 text-left sm:grid-cols-3 sm:p-4">
                  {[
                    ["Present today", "24", "of 28 staff", "bg-emerald-500"],
                    ["Late arrivals", "3", "grace 15 min", "bg-amber-500"],
                    ["Hours logged", "186h", "this week", "bg-neutral-900"],
                  ].map(([k, v, s, bar]) => (
                    <div key={k} className="rounded-xl border border-neutral-200/70 bg-white p-4">
                      <div className="text-xs font-medium text-neutral-500">{k}</div>
                      <div className="mt-1 text-2xl font-bold tracking-tight">{v}</div>
                      <div className="mt-0.5 text-[11px] text-neutral-400">{s}</div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                        <div className={`h-full w-3/4 rounded-full ${bar}`} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="hidden gap-2 px-4 pb-4 sm:grid sm:grid-cols-[1fr_1fr_1fr_auto]">
                  {["Samuel M. · 08:54 · Present", "Efua O. · 09:21 · Late", "Kwame A. · 08:47 · Present"].map((r) => (
                    <div key={r} className="rounded-lg border border-neutral-200/70 bg-white px-3 py-2 text-[11.5px] font-medium text-neutral-600">{r}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t border-neutral-200/70 bg-[#F8FAFC]">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-400">Features</p>
            <h2 className="mt-2 max-w-xl text-balance text-2xl font-bold tracking-tight sm:text-3xl">Everything you need to run attendance</h2>
            <p className="mt-2 text-[15px] text-neutral-500">Built for organization admins, effortless for staff.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div key={f.title} className="group rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift sm:p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white transition group-hover:scale-105">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div className="mt-4 text-[15px] font-semibold tracking-tight">{f.title}</div>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-neutral-500">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How */}
        <section id="how" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-400">How it works</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Live in three steps</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map(([t, d], i) => (
              <div key={t} className="relative rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-soft sm:p-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">{i + 1}</div>
                <div className="mt-4 text-[15px] font-semibold">{t}</div>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-neutral-500">{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Security */}
        <section id="security" className="bg-neutral-950 text-white">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Security</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Secure by design, not by promise</h2>
                <p className="mt-3 max-w-lg text-[14.5px] leading-relaxed text-neutral-400">
                  HTTP-only sessions, hashed single-use tokens, server-side timestamps, tenant isolation on every query, rate limiting, and immutable audit logs.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link href="/login" className="rounded-2xl bg-white px-6 py-3 text-center text-sm font-semibold text-neutral-900 transition hover:bg-neutral-200">
                    Get started
                  </Link>
                  <a href="#features" className="rounded-2xl border border-white/20 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10">
                    Explore features
                  </a>
                </div>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2">
                {["HTTP-only sessions", "Hashed invite tokens", "Server timestamps", "Tenant isolation", "Rate limiting", "Audit logs"].map((s) => (
                  <li key={s} className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[13.5px] font-medium">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" /> {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-200/70">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-[13px] text-neutral-500 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 text-[13px] text-white">◷</span>
            <span className="font-bold text-neutral-900">Chrono</span>
            <span className="hidden sm:inline">· Smart attendance. Simple management.</span>
          </div>
          <div>© {new Date().getFullYear()} Chrono. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
