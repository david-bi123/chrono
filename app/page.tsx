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
  Lock,
  Smartphone,
  Zap,
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

/** Stylised product preview for the hero — a static illustration of the dashboard, not live data. */
function DashboardMock() {
  const rows = [
    { initials: "KM", tone: "bg-brand-50 text-brand-600", name: "K. Mensah", dept: "Engineering", time: "07:52 → Working", status: "Present", pill: "bg-emerald-50 text-emerald-700" },
    { initials: "AO", tone: "bg-amber-50 text-amber-600", name: "A. Owusu", dept: "Design", time: "08:21 → Working", status: "Late", pill: "bg-amber-50 text-amber-700" },
    { initials: "EB", tone: "bg-sky-50 text-sky-600", name: "E. Boateng", dept: "Operations", time: "07:45 → 17:02", status: "Present", pill: "bg-emerald-50 text-emerald-700" },
  ];
  const nav = ["Overview", "Attendance", "Staff", "QR Codes", "Reports"];
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white text-left shadow-lift">
      {/* Browser bar */}
      <div className="flex items-center gap-2 border-b border-neutral-100 px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-200" />
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-200" />
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-200" />
        </span>
        <span className="ml-2 inline-flex min-w-0 items-center gap-1.5 rounded-md bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-500">
          <Lock className="h-3 w-3 shrink-0" aria-hidden />
          <span className="truncate">chronoswift.app/dashboard</span>
        </span>
      </div>

      <div className="grid md:grid-cols-[190px_minmax(0,1fr)]">
        {/* Mini sidebar */}
        <div className="hidden flex-col gap-1 border-r border-neutral-100 p-3 md:flex" aria-hidden>
          <div className="mb-2 flex items-center gap-2 px-2 py-1">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-neutral-900 text-[10px] font-bold text-white">C</span>
            <span className="text-[12px] font-semibold text-neutral-900">Acme Ltd</span>
          </div>
          {nav.map((n, i) => (
            <span
              key={n}
              className={
                "rounded-lg px-2.5 py-2 text-[12.5px] font-medium " +
                (i === 0 ? "bg-brand-50 text-brand-700" : "text-neutral-500")
              }
            >
              {n}
            </span>
          ))}
          <div className="mt-auto flex items-center gap-2 px-2 pt-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-[10px] font-bold text-white">AA</span>
            <span className="text-[12px] font-medium text-neutral-600">A. Admin</span>
          </div>
        </div>

        {/* Main panel */}
        <div className="min-w-0 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-[13.5px] font-semibold text-neutral-900">Today&apos;s attendance</div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Live
            </span>
          </div>
          <div className="mt-3 flex items-end gap-3">
            <div className="text-[40px] font-semibold leading-none tracking-[-0.03em] tabular text-neutral-900 sm:text-[48px]">
              94<span className="text-[22px] font-medium text-neutral-400">%</span>
            </div>
            <div className="pb-1 text-[12.5px] font-medium text-neutral-500">of 32 staff present</div>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-100" aria-hidden>
            <div className="h-full w-[94%] rounded-full bg-emerald-500" />
          </div>

          <ul className="mt-5 space-y-2">
            {rows.map((r) => (
              <li
                key={r.name}
                className="flex items-center justify-between gap-3 rounded-xl border border-neutral-100 bg-neutral-50/60 px-3.5 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${r.tone}`} aria-hidden>
                    {r.initials}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold text-neutral-900">{r.name}</div>
                    <div className="truncate text-[11.5px] tabular text-neutral-500">
                      {r.dept} · {r.time}
                    </div>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${r.pill}`}>{r.status}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <Logo size="md" className="shrink-0 [&>span:last-child]:hidden min-[400px]:[&>span:last-child]:inline" />
          </div>
          <nav className="hidden items-center gap-7 text-sm font-medium text-neutral-500 lg:flex" aria-label="Primary">
            <a href="#features" className="transition hover:text-neutral-900">Features</a>
            <a href="#how" className="transition hover:text-neutral-900">How it works</a>
            <a href="#roles" className="transition hover:text-neutral-900">Roles</a>
            <a href="#faq" className="transition hover:text-neutral-900">FAQ</a>
          </nav>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link href="/login" className="hidden rounded-xl px-3.5 py-2 text-sm font-semibold text-neutral-600 transition hover:text-neutral-900 min-[420px]:block">
              Sign in
            </Link>
            <Link href="/login" className="rounded-xl bg-neutral-900 px-3.5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-neutral-800 active:scale-[0.98] sm:px-4 sm:py-2.5">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_340px_at_50%_-80px,rgba(11,15,25,0.09),transparent)]" />
          <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 text-center sm:px-6 sm:pb-20 sm:pt-20">
            <div className="mx-auto inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 py-1.5 pl-2 pr-3.5 text-center text-xs font-semibold text-neutral-600">
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Real-time team attendance
            </div>
            <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-bold leading-[1.05] tracking-[-0.03em] sm:text-5xl md:text-6xl">
              See who&apos;s working, the moment they clock in.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-balance text-[15px] leading-relaxed text-neutral-500 sm:text-base">
              ChronoSwift turns any printed QR code into a tamper-proof time clock. No apps to install, no hardware to buy — just scan and go.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/login" className="w-full rounded-2xl bg-neutral-900 px-7 py-3.5 text-sm font-semibold text-white shadow-lift transition hover:bg-neutral-800 active:scale-[0.98] sm:w-auto">
                Get started
              </Link>
              <a href="#how" className="w-full rounded-2xl border border-neutral-200 bg-white px-7 py-3.5 text-sm font-semibold text-neutral-700 shadow-soft transition hover:bg-neutral-50 sm:w-auto">
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
                  <t.icon className="h-4 w-4 text-emerald-600" aria-hidden />
                  {t.text}
                </span>
              ))}
            </div>

            {/* Product preview */}
            <div className="relative mx-auto mt-12 max-w-4xl sm:mt-14">
              <div className="pointer-events-none absolute -inset-x-8 top-8 -bottom-8 bg-[radial-gradient(500px_260px_at_50%_0%,rgba(31,79,224,0.08),transparent)]" aria-hidden />
              <div className="relative">
                <DashboardMock />
                <div className="absolute -right-3 top-14 hidden items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-[12.5px] font-semibold text-neutral-800 shadow-lift md:flex lg:-right-8" aria-hidden>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  Clocked in · 07:52
                </div>
                <div className="absolute -left-3 bottom-14 hidden items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-[12.5px] font-semibold text-neutral-800 shadow-lift md:flex lg:-left-8" aria-hidden>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                    <Clock className="h-3.5 w-3.5" />
                  </span>
                  Late arrivals flagged
                </div>
              </div>
              <p className="mt-4 text-center text-[12px] text-neutral-400">Illustrated preview of the live dashboard</p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-20 border-t border-neutral-200/70 bg-[#F8FAFC]">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Features</p>
            <h2 className="mt-2 max-w-xl text-balance text-2xl font-bold tracking-tight sm:text-3xl">Everything you need to run attendance</h2>
            <p className="mt-2 text-[15px] text-neutral-500">Built for organization admins, effortless for staff.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div key={f.title} className="group rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift sm:p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white transition group-hover:scale-105">
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
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">How it works</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Live in three steps</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                ["Create your organization", "Super admin provisions your tenant. Your admin gets a secure 72-hour setup link by email — no passwords in email, ever."],
                ["Invite staff & print QR", "Invite the team, create locations like Reception or Warehouse. Each gets its own revocable QR to print."],
                ["Scan, clock in, report", "Staff scan with any phone camera and tap Clock In. Admins watch live dashboards and export reports."],
              ].map(([t, d], i) => (
                <div key={t} className="relative rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-soft sm:p-6">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">{i + 1}</div>
                  <div className="mt-4 text-[15px] font-semibold">{t}</div>
                  <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Roles */}
        <section id="roles" className="scroll-mt-20 border-t border-neutral-200/70 bg-[#F8FAFC]">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Roles</p>
            <h2 className="mt-2 max-w-xl text-balance text-2xl font-bold tracking-tight sm:text-3xl">One platform, three workspaces</h2>
            <p className="mt-2 max-w-xl text-[15px] text-neutral-500">Everyone sees exactly what their role allows — enforced on the server, not just hidden in the UI.</p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {roles.map((r) => (
                <div key={r.title} className="flex flex-col rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-soft sm:p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-800">
                    <r.icon className="h-5 w-5" />
                  </div>
                  <div className="mt-4 text-[15px] font-semibold tracking-tight">{r.title}</div>
                  <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{r.desc}</p>
                  <ul className="mt-4 space-y-1.5 border-t border-neutral-100 pt-4 text-sm font-medium text-neutral-600">
                    {r.points.map((p) => (
                      <li key={p} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-600" />{p}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security */}
        <section id="security" className="bg-neutral-950 text-white">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Security</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Secure by design, not by promise</h2>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-neutral-400">
                  HTTP-only sessions, hashed single-use tokens, server-side timestamps, tenant isolation on every query, rate limiting, and immutable audit logs.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link href="/login" className="rounded-2xl bg-white px-6 py-3 text-center text-sm font-semibold text-neutral-900 transition hover:bg-neutral-200">
                    Get started
                  </Link>
                  <a href="#faq" className="rounded-2xl border border-white/20 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10">
                    Read the FAQ
                  </a>
                </div>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2">
                {["HTTP-only sessions", "Hashed invite tokens", "Server timestamps", "Tenant isolation", "Rate limiting", "Audit logs"].map((s) => (
                  <li key={s} className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" /> {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20">
          <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
            <p className="text-center text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">FAQ</p>
            <h2 className="mt-2 text-center text-2xl font-bold tracking-tight sm:text-3xl">Honest answers</h2>
            <div className="mt-8 space-y-3">
              {faqs.map((f) => (
                <details key={f.q} className="group rounded-2xl border border-neutral-200/70 bg-white px-5 py-4 shadow-soft open:shadow-lift">
                  <summary className="cursor-pointer list-none text-sm font-semibold tracking-tight [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center justify-between gap-3">
                      {f.q}
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition group-open:rotate-45 group-open:bg-neutral-900 group-open:text-white">+</span>
                    </span>
                  </summary>
                  <p className="mt-2.5 text-sm leading-relaxed text-neutral-500">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-neutral-200/70 bg-[#F8FAFC]">
          <div className="mx-auto max-w-6xl px-4 py-14 text-center sm:px-6 sm:py-16">
            <h2 className="mx-auto max-w-xl text-balance text-2xl font-bold tracking-tight sm:text-3xl">Ready to ditch the paper register?</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">Set up your organization today. Your team can be clocking in by tomorrow — no hardware, no app installs.</p>
            <Link href="/login" className="mt-6 inline-block rounded-2xl bg-neutral-900 px-8 py-3.5 text-sm font-semibold text-white shadow-lift transition hover:bg-neutral-800 active:scale-[0.98]">
              Get started
            </Link>
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
