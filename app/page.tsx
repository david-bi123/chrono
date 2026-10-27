import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import {
  QrCode,
  Users,
  BarChart3,
  ShieldCheck,
  Clock,
  BellRing,
  Check,
  Building2,
  UserCog,
  HardHat,
  Smartphone,
  Zap,
  ClipboardCheck,
  FileSpreadsheet,
  AlarmClock,
  ArrowRight,
  ScanLine,
  UserRound,
  LogOut,
} from "lucide-react";

const features = [
  { icon: QrCode, title: "QR clock-in", desc: "One QR per entrance. Staff scan, tap Clock In — timestamps are recorded server-side, never from the phone clock." },
  { icon: Clock, title: "Late & absence detection", desc: "Per-organization start times, grace periods, working days and timezones. Defaults to Africa/Accra." },
  { icon: Users, title: "Staff management", desc: "Email invitations with single-use secure links, departments, disable/reactivate, and resend with throttling." },
  { icon: BarChart3, title: "Reports & exports", desc: "Filter by date, status, staff or search. Server-generated CSV exports for payroll and audits." },
  { icon: ShieldCheck, title: "Tenant isolation", desc: "Every record carries an organizationId enforced on the server. Org A can never see Org B — not just hidden in UI." },
  { icon: BellRing, title: "Audit trail", desc: "Invitations, QR rotations, corrections and settings changes are logged with actor, IP and timestamp." },
];

const roles = [
  {
    icon: Building2,
    title: "Platform owner",
    desc: "Provision tenants, suspend abusers, and watch platform activity — without touching tenant data.",
    points: ["Create organizations", "Suspend / reactivate tenants", "Platform-wide audit"],
  },
  {
    icon: UserCog,
    title: "Organization admin",
    desc: "Invite staff, print QR codes, watch the live dashboard and export payroll-ready reports.",
    points: ["Invite & manage staff", "QR locations & rotation", "Reports & CSV export"],
  },
  {
    icon: HardHat,
    title: "Staff",
    desc: "Scan the entrance QR with any phone camera, tap once, and get on with the day.",
    points: ["One-tap clock in/out", "Today + history view", "Profile & password control"],
  },
];

const faqs = [
  {
    q: "Do staff need to install an app?",
    a: "No. Staff open the QR link in any phone browser and tap Clock In — nothing to install, no hardware to buy. Accounts are created by invitation and each person sets their own password.",
  },
  {
    q: "Does the QR code prove someone is physically present?",
    a: "No — it proves they scanned a valid, unrevoked code for their organization. Codes can be rotated any time from the dashboard, which instantly invalidates old prints and photos. GPS geofencing is a possible future opt-in, not included by default.",
  },
  {
    q: "Why did my invitation land in Spam?",
    a: "New senders often do, especially when sent from a Gmail address through an email service. Every screen that sends mail in ChronoSwift tells the recipient to check Spam and Promotions. Using your own domain as the sender (with SPF/DKIM records) fixes this permanently.",
  },
  {
    q: "What timezone is attendance recorded in?",
    a: "Each organization sets its own timezone (default Africa/Accra). Timestamps are captured on the server in UTC and displayed in the organization's timezone, so phone-clock tampering can't change records.",
  },
  {
    q: "Can staff clock in for each other?",
    a: "Each staff member signs in with their own account before the Clock In button appears, and the QR's organization must match their account. Sharing passwords would be visible in each person's own history.",
  },
  {
    q: "What happens if someone forgets to clock out?",
    a: "Their day stays marked Incomplete until an admin corrects it under Attendance with a written reason — every correction is audit-logged, never silent.",
  },
];

const hrWins = [
  {
    icon: ClipboardCheck,
    title: "One dashboard, not paper",
    desc: "Every clock-in lands in a live dashboard. Month-end means opening Reports — not chasing registers around the office.",
  },
  {
    icon: FileSpreadsheet,
    title: "Payroll-ready exports",
    desc: "Filter by date, staff or status and download CSV straight into payroll, with hours already computed.",
  },
  {
    icon: AlarmClock,
    title: "Fair lateness, automatically",
    desc: "Start times and grace periods apply the same rules to everyone, backed by an audit trail on every record.",
  },
];

function HeroFlow() {
  return (
    <div className="relative mx-auto mt-14 w-full max-w-4xl sm:mt-16">
      {/* Glow */}
      <div className="pointer-events-none absolute -inset-x-6 -top-10 bottom-8 rounded-[32px] bg-gradient-to-b from-brand-200/40 via-teal-100/25 to-transparent blur-2xl" aria-hidden />

      <div className="relative grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center sm:gap-2">
        {/* Step 1 — scan */}
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-5 text-center shadow-card transition hover:-translate-y-0.5 hover:shadow-lift">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-600/30">
            <QrCode className="h-6 w-6" aria-hidden />
          </span>
          <div className="mt-3.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-brand-600">Step 1</div>
          <div className="mt-1 text-[15px] font-semibold tracking-tight text-neutral-900">Scan the entrance code</div>
          <p className="mt-1 text-[13px] leading-relaxed text-neutral-500">Any phone camera. No app, no hardware.</p>
        </div>

        {/* Connector */}
        <div className="hidden sm:block" aria-hidden>
          <ArrowRight className="mx-auto h-5 w-5 text-neutral-300" />
        </div>

        {/* Step 2 — tap */}
        <div className="relative overflow-hidden rounded-2xl border border-brand-200 bg-white p-5 text-center shadow-card ring-1 ring-brand-100 transition hover:-translate-y-0.5 hover:shadow-lift">
          <span className="mx-auto block w-16 rounded-[12px] border-2 border-neutral-200 bg-white p-1.5 shadow-xs">
            <span className="block rounded-full bg-gradient-to-r from-brand-500 to-teal-500 px-2 py-1.5 text-[9px] font-bold leading-tight text-white">Clock In</span>
          </span>
          <div className="mt-3.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-brand-600">Step 2</div>
          <div className="mt-1 text-[15px] font-semibold tracking-tight text-neutral-900">One enormous tap</div>
          <p className="mt-1 text-[13px] leading-relaxed text-neutral-500">Clock In, Clock Out — that&apos;s the whole app.</p>
        </div>

        {/* Connector */}
        <div className="hidden sm:block" aria-hidden>
          <ArrowRight className="mx-auto h-5 w-5 text-neutral-300" />
        </div>

        {/* Step 3 — server */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-950 bg-emerald-950 p-5 text-center shadow-lift">
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-brand-600/30 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-teal-500/20 blur-2xl" />
          </div>
          <div className="relative">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
              <ShieldCheck className="h-6 w-6 text-brand-300" aria-hidden />
            </span>
            <div className="mt-3.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-brand-300">Step 3</div>
            <div className="mt-1 text-[15px] font-semibold tracking-tight text-white">The server records it</div>
            <p className="mt-1 text-[13px] leading-relaxed text-neutral-300/90">Phone clocks can&apos;t change a single digit.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="sticky top-0 z-40 border-b border-neutral-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <Logo size="md" className="shrink-0 [&>span:last-child]:hidden min-[400px]:[&>span:last-child]:inline" />
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-neutral-500 lg:flex" aria-label="Primary">
            <a href="#features" className="transition hover:text-neutral-900">Features</a>
            <a href="#how" className="transition hover:text-neutral-900">How it works</a>
            <a href="#roles" className="transition hover:text-neutral-900">Roles</a>
            <a href="#faq" className="transition hover:text-neutral-900">FAQ</a>
          </nav>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link href="/login" className="hidden rounded-xl px-3.5 py-2 text-sm font-semibold text-neutral-600 transition hover:text-neutral-900 min-[420px]:block">
              Sign in
            </Link>
            <Link href="/login" className="group inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-brand-700/50 transition hover:from-brand-600 hover:to-brand-700 active:scale-[0.98] sm:px-4 sm:py-2.5">
              Get started
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          {/* Ambient background */}
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[length:56px_56px] [mask-image:radial-gradient(ellipse_75%_60%_at_50%_0%,black_35%,transparent_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(900px_420px_at_50%_-120px,rgba(16,185,129,0.14),transparent)]" />
          </div>

          <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-14 text-center sm:px-6 sm:pb-24 sm:pt-20">
            <div className="mx-auto inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-brand-100 bg-brand-50 py-1.5 pl-2 pr-3.5 text-center text-xs font-semibold text-brand-700 shadow-xs">
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
              </span>
              Real-time team attendance
            </div>
            <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-bold leading-[1.05] tracking-[-0.03em] sm:text-5xl md:text-6xl">
              Making the work of HR{" "}
              <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-teal-500 bg-clip-text text-transparent">
                easier and simpler.
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-balance text-[15px] leading-relaxed text-neutral-500 sm:text-base">
              ChronoSwift takes attendance off your plate — staff clock in with a QR scan while late arrivals, absences and payroll-ready reports take care of themselves.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/login" className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-brand-500 to-brand-600 px-7 py-3.5 text-sm font-semibold text-white shadow-md shadow-brand-600/25 ring-1 ring-brand-700/50 transition hover:from-brand-600 hover:to-brand-700 hover:shadow-lg hover:shadow-brand-600/30 active:scale-[0.98] sm:w-auto">
                Get started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
              <a href="#how" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-7 py-3.5 text-sm font-semibold text-neutral-700 shadow-soft transition hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.98] sm:w-auto">
                See how it works
              </a>
            </div>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-neutral-500">
              {[
                { icon: Smartphone, text: "No app installs" },
                { icon: Zap, text: "Live from day one" },
                { icon: ShieldCheck, text: "Isolated tenants" },
              ].map((t) => (
                <span key={t.text} className="inline-flex items-center gap-1.5">
                  <t.icon className="h-4 w-4 text-brand-600" aria-hidden />
                  {t.text}
                </span>
              ))}
            </div>

            {/* Scan → tap → recorded */}
            <HeroFlow />

            {/* Why HR teams switch — realistic outcomes, no mock data */}
            <div className="mx-auto mt-14 grid max-w-4xl gap-4 text-left sm:mt-16 md:grid-cols-3">
              {hrWins.map((w) => (
                <div key={w.title} className="rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-soft backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card sm:p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-teal-50 text-brand-600 ring-1 ring-brand-100">
                    <w.icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="mt-4 text-[15px] font-semibold tracking-tight">{w.title}</div>
                  <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{w.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-20 border-t border-neutral-200/70 bg-neutral-50/80">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600">Features</p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="max-w-xl text-balance text-2xl font-bold tracking-tight sm:text-3xl">Everything you need to run attendance</h2>
                <p className="mt-2 text-[15px] text-neutral-500">Built for organization admins, effortless for staff.</p>
              </div>
              <Link href="/login" className="group inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 shadow-xs transition hover:border-brand-200 hover:text-brand-700">
                Try it now
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </div>
            <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div key={f.title} className="group relative overflow-hidden rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card sm:p-6">
                  <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-brand-100/0 blur-2xl transition duration-300 group-hover:bg-brand-100/60" aria-hidden />
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white shadow-sm transition-all duration-200 group-hover:scale-105 group-hover:bg-brand-600">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div className="mt-4 text-[15px] font-semibold tracking-tight">{f.title}</div>
                  <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How */}
        <section id="how" className="scroll-mt-20 border-t border-neutral-200/70">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600">How it works</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Live in three steps</h2>
            <div className="relative mt-10 grid gap-4 md:grid-cols-3">
              {/* Connector line */}
              <div className="pointer-events-none absolute left-0 right-0 top-7 hidden border-t border-dashed border-brand-200 md:block" aria-hidden />
              {(
                [
                  { title: "Create your organization", desc: "Super admin provisions your tenant. Your admin gets a secure 72-hour setup link by email — no passwords in email, ever.", icon: Building2 },
                  { title: "Invite staff & print QR", desc: "Invite the team, create locations like Reception or Warehouse. Each gets its own revocable QR to print.", icon: QrCode },
                  { title: "Scan, clock in, report", desc: "Staff scan with any phone camera and tap Clock In. Admins watch live dashboards and export reports.", icon: ScanLine },
                ] as const
              ).map(({ title, desc, icon: StepIcon }, i) => (
                <div key={title} className="relative rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-b from-brand-500 to-brand-700 text-sm font-bold text-white shadow-md shadow-brand-600/30">{i + 1}</div>
                    <StepIcon className="h-5 w-5 text-brand-500" aria-hidden />
                  </div>
                  <div className="mt-4 text-[15px] font-semibold">{title}</div>
                  <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Roles */}
        <section id="roles" className="scroll-mt-20 border-t border-neutral-200/70 bg-neutral-50/80">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600">Roles</p>
            <h2 className="mt-2 max-w-xl text-balance text-2xl font-bold tracking-tight sm:text-3xl">One platform, three workspaces</h2>
            <p className="mt-2 max-w-xl text-[15px] text-neutral-500">Everyone sees exactly what their role allows — enforced on the server, not just hidden in the UI.</p>
            <div className="mt-9 grid gap-4 md:grid-cols-3">
              {roles.map((r, i) => (
                <div key={r.title} className={`relative flex flex-col rounded-2xl border p-5 transition sm:p-6 ${i === 1 ? "border-brand-200 bg-white shadow-card ring-1 ring-brand-100 hover:shadow-lift" : "border-neutral-200/70 bg-white shadow-soft hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card"}`}>
                  {i === 1 && (
                    <span className="absolute -top-2.5 left-5 rounded-full bg-gradient-to-r from-brand-600 to-teal-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm" aria-hidden>
                      Most used
                    </span>
                  )}
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-teal-50 text-brand-600 ring-1 ring-brand-100">
                    <r.icon className="h-5 w-5" />
                  </div>
                  <div className="mt-4 text-[15px] font-semibold tracking-tight">{r.title}</div>
                  <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{r.desc}</p>
                  <ul className="mt-4 space-y-2 border-t border-neutral-100 pt-4 text-sm font-medium text-neutral-600">
                    {r.points.map((p) => (
                      <li key={p} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-brand-600" />{p}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security */}
        <section id="security" className="relative overflow-hidden bg-emerald-950 text-white">
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[length:56px_56px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,black_30%,transparent_100%)]" />
            <div className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-brand-600/20 blur-3xl" />
            <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-teal-500/15 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-300">Security</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Secure by design, not by promise</h2>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-neutral-300/90">
                  HTTP-only sessions, hashed single-use tokens, server-side timestamps, tenant isolation on every query, rate limiting, and immutable audit logs.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link href="/login" className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-brand-50">
                    Get started
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                  <a href="#faq" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10">
                    Read the FAQ
                  </a>
                </div>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2">
                {["HTTP-only sessions", "Hashed invite tokens", "Server timestamps", "Tenant isolation", "Rate limiting", "Audit logs"].map((s) => (
                  <li key={s} className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-medium shadow-sm backdrop-blur-sm transition hover:border-brand-400/40 hover:bg-white/[0.08]">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-brand-300" /> {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
            <p className="text-center text-xs font-bold uppercase tracking-[0.14em] text-brand-600">FAQ</p>
            <h2 className="mt-2 text-center text-2xl font-bold tracking-tight sm:text-3xl">Honest answers</h2>
            <div className="mt-9 space-y-3">
              {faqs.map((f) => (
                <details key={f.q} className="group rounded-2xl border border-neutral-200/70 bg-white px-5 py-4 shadow-soft transition open:border-brand-200 open:shadow-card">
                  <summary className="cursor-pointer list-none text-sm font-semibold tracking-tight [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center justify-between gap-3">
                      {f.q}
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition duration-200 group-open:rotate-45 group-open:bg-brand-600 group-open:text-white">+</span>
                    </span>
                  </summary>
                  <p className="mt-2.5 border-t border-neutral-100 pt-2.5 text-sm leading-relaxed text-neutral-500">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-neutral-200/70 bg-neutral-50/80">
          <div className="mx-auto max-w-6xl px-4 py-14 text-center sm:px-6 sm:py-20">
            <div className="relative mx-auto max-w-3xl overflow-hidden rounded-[28px] bg-gradient-to-br from-brand-600 via-brand-700 to-teal-800 px-6 py-12 shadow-lift sm:px-12 sm:py-16">
              <div className="pointer-events-none absolute inset-0" aria-hidden>
                <div className="absolute inset-0 [background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_60%_80%_at_50%_50%,black,transparent)]" />
                <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-400/20 blur-3xl" />
                <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-teal-400/20 blur-3xl" />
              </div>
              <div className="relative">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
                  <QrCode className="h-6 w-6 text-brand-100" aria-hidden />
                </span>
                <h2 className="mx-auto mt-5 max-w-xl text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl">Ready to ditch the paper register?</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-brand-100/90">Set up your organization today. Your team can be clocking in by tomorrow — no hardware, no app installs.</p>
                <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link href="/login" className="group inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-semibold text-brand-800 shadow-lift transition hover:bg-brand-50 active:scale-[0.98]">
                    Get started
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                  <a href="#faq" className="inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10">
                    Read the FAQ
                  </a>
                </div>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[12.5px] font-medium text-brand-100/80">
                  <span className="inline-flex items-center gap-1.5"><ScanLine className="h-3.5 w-3.5" /> Free to try</span>
                  <span className="inline-flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5" /> Unlimited staff per organization</span>
                  <span className="inline-flex items-center gap-1.5"><LogOut className="h-3.5 w-3.5" /> No hardware to buy</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-200/70">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-neutral-500 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="hidden sm:inline">· Smart attendance. Simple management.</span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] font-medium" aria-label="Footer">
            <a href="#features" className="transition hover:text-neutral-900">Features</a>
            <a href="#how" className="transition hover:text-neutral-900">How it works</a>
            <a href="#security" className="transition hover:text-neutral-900">Security</a>
            <a href="#faq" className="transition hover:text-neutral-900">FAQ</a>
            <Link href="/login" className="transition hover:text-neutral-900">Sign in</Link>
          </nav>
          <div className="text-[13px]">© {new Date().getFullYear()} ChronoSwift. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
