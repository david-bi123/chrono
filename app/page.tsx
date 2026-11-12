import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import {
  AlarmClock,
  ArrowRight,
  BarChart3,
  BellRing,
  Building2,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileSpreadsheet,
  HardHat,
  Lock,
  Mail,
  QrCode,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserCog,
  Users,
  Zap,
} from "lucide-react";

import { Logo, LogoMark } from "@/components/brand/logo";
import { HeroTimeChip } from "@/components/landing/hero-time-chip";
import { MobileNav } from "@/components/landing/mobile-nav";
import { ProductTour } from "@/components/landing/product-tour";
import { Reveal } from "@/components/landing/reveal";
import { StatusBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CONTACT_EMAIL = "samueldagbo50@gmail.com";
const REQUEST_HREF = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
  "ChronoSwift workspace request"
)}&body=${encodeURIComponent(
  "Hi SamTech Labs,\n\nWe'd like a ChronoSwift workspace for our team.\n\nOrganization:\nTeam size:\nAdmin name and email:\nTime zone:\n\nThank you."
)}`;

const NAV_LINKS = [
  { href: "#product", label: "Product" },
  { href: "#how", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#roles", label: "Roles" },
  { href: "#faq", label: "FAQ" },
];

export const metadata: Metadata = {
  title: { absolute: "ChronoSwift — QR attendance, staff management and reports" },
  description:
    "Staff clock in by scanning one QR code. ChronoSwift records server-side timestamps, applies your late and absence rules automatically, keeps payroll-ready reports and an audit trail.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "ChronoSwift — Smart attendance. Simple management.",
    description:
      "QR clock-in, automatic late detection, staff management and CSV reports for modern organizations. No app installs.",
    type: "website",
  },
};

const guarantees = [
  { icon: Clock, label: "Server-side timestamps" },
  { icon: Smartphone, label: "No app to install" },
  { icon: QrCode, label: "One code per location" },
  { icon: ShieldCheck, label: "Tenant-isolated records" },
];

const steps = [
  {
    title: "We provision your workspace",
    desc: "Your platform admin creates the organization and emails your admin a single-use setup link that expires in 72 hours.",
    icon: Building2,
  },
  {
    title: "Invite staff, print one QR",
    desc: "Add your team by email, create a location like Reception or Warehouse, and print its code. Every location gets its own.",
    icon: QrCode,
  },
  {
    title: "Scan once, every working day",
    desc: "Staff use any phone camera and tap Clock In. The dashboard fills in live while the server keeps the record straight.",
    icon: ScanLine,
  },
];

const features = [
  {
    icon: QrCode,
    title: "QR clock-in, with a code you can kill",
    desc: "Each entrance has its own code, shown once and stored only as a hash. Regenerate it and every printed copy or photo stops working instantly.",
    span: "lg:col-span-3",
    visual: "qr",
  },
  {
    icon: ShieldCheck,
    title: "Tenant isolation, not just hidden UI",
    desc: "Every record carries an organizationId enforced on the server. Organization A can never read Organization B's staff, codes or reports — no URL changes that.",
    span: "lg:col-span-3",
    visual: "isolation",
  },
  {
    icon: AlarmClock,
    title: "Late and absence, decided by rules",
    desc: "Set start time, grace minutes, working days and timezone once. Everyone is judged the same way — automatically.",
    span: "lg:col-span-2",
    visual: "late",
  },
  {
    icon: Users,
    title: "Staff without the paperwork",
    desc: "Email invitations with single-use links, departments and positions, and disable or reactivate people instead of deleting their history.",
    span: "lg:col-span-2",
    visual: "staff",
  },
  {
    icon: FileSpreadsheet,
    title: "Payroll-ready reports",
    desc: "Filter any date range, see attendance by department, and export a CSV with hours already computed for you.",
    span: "lg:col-span-2",
    visual: "reports",
  },
  {
    icon: BellRing,
    title: "A trail you can defend",
    desc: "Invitations, QR rotations, corrections and settings changes are logged with actor, IP address, timestamp and — on corrections — the written reason. Entries can't be edited or deleted.",
    span: "lg:col-span-6",
    visual: "audit",
  },
];

const statuses = [
  { value: "PRESENT", desc: "Clocked in inside the grace window." },
  { value: "LATE", desc: "Clocked in after start time plus grace." },
  { value: "EARLY_LEAVE", desc: "Clocked out more than 15 minutes early." },
  { value: "HALF_DAY", desc: "Late and short — under four hours total." },
  { value: "INCOMPLETE", desc: "Never clocked out; waits for a correction." },
  { value: "ABSENT", desc: "Active staff with no record that day." },
];

const comparison = [
  {
    before: "Names written by hand, then typed into a spreadsheet at month-end.",
    after: "Scan at the door. The server writes the timestamp the moment it happens.",
  },
  {
    before: "Lateness depends on who is reading the clock that morning.",
    after: "Grace minutes applied the same way to every person, every day.",
  },
  {
    before: "\u201cI was here at eight\u201d — and no way to prove otherwise.",
    after: "A permanent audit entry showing who changed what, when, and why.",
  },
];

const plans = [
  {
    id: "starter",
    name: "Starter",
    priceGhs: 500,
    tagline: "One location getting attendance fully under control.",
    limits: ["Up to 30 staff accounts", "1 branch · 2 managers", "6 months of attendance history"],
    features: [
      "QR clock-in and clock-out",
      "Live attendance monitoring",
      "Daily present, absent and late tracking",
      "Early departure tracking",
      "Attendance history and monthly summaries",
      "Basic reports and CSV export",
      "Staff invitations and profiles",
      "Standard support",
    ],
    featured: false,
  },
  {
    id: "growth",
    name: "Growth",
    priceGhs: 750,
    tagline: "Reporting depth and branch visibility as headcount grows.",
    limits: ["Up to 70 staff accounts", "3 branches · 5 managers", "12 months of attendance history"],
    features: [
      "Everything in Starter",
      "Advanced attendance analytics",
      "Weekly and monthly trends",
      "Branch-level attendance reports",
      "Attendance corrections and approvals",
      "More flexible attendance rules",
      "Detailed employee statistics",
      "Manager-level permissions",
    ],
    featured: true,
  },
  {
    id: "business",
    name: "Business",
    priceGhs: 1000,
    tagline: "Organisation-wide oversight with no capacity ceiling.",
    limits: ["Unlimited staff accounts", "Unlimited branches and managers", "Unlimited attendance history"],
    features: [
      "Everything in Growth",
      "Organisation-wide analytics",
      "Comparative branch performance",
      "Advanced attendance configuration",
      "Comprehensive audit logs",
      "Advanced roles and permissions",
      "Enhanced organisation oversight",
      "Priority support",
    ],
    featured: false,
  },
];

const planMatrix = [
  { label: "Staff accounts", starter: "30", growth: "70", business: "Unlimited" },
  { label: "Branches", starter: "1", growth: "3", business: "Unlimited" },
  { label: "Manager accounts", starter: "2", growth: "5", business: "Unlimited" },
  { label: "Attendance history", starter: "6 months", growth: "12 months", business: "Unlimited" },
  { label: "QR clock-in and live monitoring", starter: true, growth: true, business: true },
  { label: "CSV export", starter: "Basic", growth: "Advanced", business: "Advanced" },
  { label: "Attendance trends and analytics", starter: false, growth: true, business: true },
  { label: "Branch-level reports", starter: false, growth: true, business: true },
  { label: "Correction requests and approvals", starter: false, growth: true, business: true },
  { label: "Organisation-wide analytics", starter: false, growth: false, business: true },
  { label: "Comparative branch performance", starter: false, growth: false, business: true },
  { label: "Audit logs", starter: false, growth: false, business: true },
  { label: "Support", starter: "Standard", growth: "Standard", business: "Priority" },
];

const roles = [
  {
    icon: Building2,
    title: "Platform owner",
    desc: "Provision tenants, suspend abusers and watch platform activity — without touching tenant data.",
    points: ["Create organizations", "Suspend or reactivate tenants", "Platform-wide audit"],
  },
  {
    icon: UserCog,
    title: "Organization admin",
    desc: "Invite staff, print QR codes, watch the live dashboard and export payroll-ready reports.",
    points: ["Invite and manage staff", "QR locations and rotation", "Reports and CSV export"],
  },
  {
    icon: HardHat,
    title: "Staff",
    desc: "Scan the entrance code with any phone camera, tap once, and get on with the day.",
    points: ["One-tap clock in and out", "Today plus full history", "Profile and password control"],
  },
];

const securityItems = [
  "HTTP-only sessions",
  "Hashed invite tokens",
  "Server timestamps",
  "Tenant isolation",
  "Rate limiting",
  "Immutable audit logs",
];

const faqs = [
  {
    q: "Do staff need to install an app?",
    a: "No. Staff open the QR link in any phone browser and tap Clock In — nothing to install, no hardware to buy. Accounts are created by invitation and each person sets their own password.",
  },
  {
    q: "Does the QR code prove someone is physically present?",
    a: "No — it proves they scanned a valid, unrevoked code for their organization from their own signed-in session. Codes can be rotated at any time from the dashboard, which instantly invalidates old prints and photos. GPS geofencing is a possible future opt-in, not included by default.",
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
    a: "Each staff member signs in with their own account before the Clock In button appears, and the QR's organization must match their account. One account can clock in only once per day, the clock endpoint is rate-limited, and every event is audit-logged.",
  },
  {
    q: "What happens if someone forgets to clock out?",
    a: "Their day stays marked Incomplete until an admin corrects it under Attendance with a written reason — every correction is audit-logged, never silent.",
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "ChronoSwift",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web browser",
      description:
        "Multi-tenant staff attendance platform. Staff clock in by scanning a QR code; timestamps, lateness rules, reports and audit logs are handled server-side.",
      featureList: [
        "QR clock-in with revocable location codes",
        "Server-side timestamps",
        "Automatic late, early-leave, half-day and absence detection",
        "Staff invitations and directory",
        "Date-range reports and CSV export",
        "Tenant isolation and immutable audit logs",
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a },
      })),
    },
  ],
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-neutral-900">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-700 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-background/[0.86] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" aria-label="ChronoSwift home" className="shrink-0 rounded-lg">
            <Logo size="md" />
          </Link>

          <nav className="hidden items-center gap-7 text-[13.5px] font-medium text-neutral-500 lg:flex" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="transition hover:text-neutral-900">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-xl px-3.5 py-2 text-sm font-semibold text-neutral-600 transition hover:text-neutral-900 sm:block"
            >
              Sign in
            </Link>
            <a
              href={REQUEST_HREF}
              className="group hidden items-center gap-1.5 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 active:scale-[0.98] lg:inline-flex"
            >
              Request access
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </a>
            <MobileNav links={NAV_LINKS} requestHref={REQUEST_HREF} />
          </div>
        </div>
      </header>

      <main id="main">
        {/* ---------------- Hero ---------------- */}
        <section className="relative isolate overflow-hidden bg-brand-950">
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div className="absolute inset-0 bg-[radial-gradient(1100px_560px_at_50%_-10%,rgba(77,143,111,0.30),transparent_70%)]" />
            <div className="absolute -left-48 top-1/4 h-[520px] w-[520px] rounded-full bg-brand-700/20 blur-[130px]" />
            <div className="absolute -right-40 -top-24 h-[560px] w-[560px] rounded-full bg-brand-600/20 blur-[140px]" />
            <div className="absolute inset-0 [background-image:linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_72%_62%_at_50%_0%,black_35%,transparent_100%)]" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-5 sm:px-6 sm:pb-16 sm:pt-6 lg:pb-14 lg:pt-7 2xl:pb-24">
            <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.66fr)] lg:items-start lg:gap-10">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-brand-400/25 bg-brand-900/50 px-3 py-1.5 text-[11.5px] font-semibold text-brand-200 shadow-lg shadow-brand-950/40 ring-1 ring-brand-500/15 backdrop-blur-sm">
                  <span className="relative flex h-1.5 w-1.5" aria-hidden>
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-70" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-300" />
                  </span>
                  Attendance recorded by the server
                </div>

                <h1 className="font-display mt-6 text-balance text-[2.15rem] font-bold leading-[1.04] tracking-[-0.035em] text-white sm:text-5xl lg:text-[3.35rem]">
                  Clock in with a scan.
                  <span className="mt-1 block bg-gradient-to-r from-brand-300 via-brand-200 to-white bg-clip-text text-transparent">
                    Run attendance from one dashboard.
                  </span>
                </h1>

                <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-brand-100/75 sm:text-base">
                  Your team scans the code at the door and taps once. ChronoSwift records the time on the
                  server, flags lateness against your own rules, and hands you payroll-ready reports.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={REQUEST_HREF}
                    className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-400 px-6 py-3.5 text-sm font-semibold text-brand-950 shadow-xl shadow-brand-950/40 transition hover:bg-brand-300 focus-visible:outline-brand-200 active:scale-[0.98] sm:w-auto"
                  >
                    Request a workspace
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </a>
                  <a
                    href="#how"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/30 hover:bg-white/[0.12] focus-visible:outline-brand-200 active:scale-[0.98] sm:w-auto"
                  >
                    See how it works
                  </a>
                </div>

                <p className="mt-5 text-[13px] text-brand-200/60">
                  Already have a workspace?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-white underline decoration-brand-400/50 underline-offset-4 transition hover:decoration-brand-300 focus-visible:outline-brand-200"
                  >
                    Sign in
                  </Link>
                </p>

                <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2.5 text-[12.5px] font-medium text-brand-100/70">
                  {guarantees.slice(1).map((item) => (
                    <li key={item.label} className="inline-flex items-center gap-1.5">
                      <item.icon className="h-3.5 w-3.5 text-brand-300" aria-hidden />
                      {item.label}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Time imagery — the sand timer */}
              <div className="relative mx-auto w-full max-w-[420px] 2xl:max-w-[470px]">
                <div className="relative h-[380px] overflow-hidden rounded-[1.6rem] border border-white/10 bg-brand-900 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.8)] sm:h-[490px] sm:rounded-[2rem] lg:h-[500px] xl:h-[530px] 2xl:h-[620px]">
                  <Image
                    src="/marketing/time/hourglass.jpg"
                    alt=""
                    fill
                    priority
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 470px"
                    className="object-cover"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-brand-950/90 via-brand-950/10 to-transparent"
                    aria-hidden
                  />
                  <div
                    className="absolute inset-0 ring-1 ring-inset ring-white/10"
                    aria-hidden
                  />
                  <HeroTimeChip />
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                    <p className="font-display text-balance text-[15px] font-semibold leading-snug text-white/95 sm:text-base">
                      Every working day, on the record.
                    </p>
                    <p className="mt-2 flex items-start gap-1.5 text-[10.5px] font-medium leading-snug text-brand-100/70">
                      <ShieldCheck className="mt-px h-3 w-3 shrink-0 text-brand-300/80" aria-hidden />
                      Timestamps come from the server, not the phone&apos;s clock.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- How it works ---------------- */}
        <section id="how" className="scroll-mt-24 border-b border-neutral-200/70">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="max-w-2xl">
              <Eyebrow>How it works</Eyebrow>
              <h2 className="font-display mt-2 text-balance text-2xl font-bold tracking-[-0.02em] sm:text-[2rem]">
                Live in three steps
              </h2>
              <p className="mt-2.5 text-[15px] leading-relaxed text-neutral-500">
                From provisioning to the first clock-in, nobody installs anything. Your admin sets the rules
                once; the rest is a scan and a tap.
              </p>
            </div>

            <div className="relative mt-10 grid gap-4 md:grid-cols-3">
              <div
                className="pointer-events-none absolute left-[16.6%] right-[16.6%] top-9 hidden border-t border-dashed border-brand-200 md:block"
                aria-hidden
              />
              {steps.map((step, index) => (
                <Reveal key={step.title} delay={index * 90} className="h-full">
                  <div className="relative h-full rounded-2xl border border-neutral-200/80 bg-card p-5 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card sm:p-6">
                    <div className="flex items-center gap-3">
                      <span className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-brand-700 text-[13px] font-bold text-white ring-4 ring-background">
                        {index + 1}
                      </span>
                      <step.icon className="h-5 w-5 text-brand-500" aria-hidden />
                      <span className="ml-auto text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                        Step {index + 1}
                      </span>
                    </div>
                    <h3 className="font-display mt-4 text-[15px] font-semibold tracking-tight">{step.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{step.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            <p className="mt-6 flex items-start gap-2 text-[13px] leading-relaxed text-neutral-500">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden />
              Setup links are single-use, hashed at rest and expire after 72 hours. Passwords are never sent
              by email.
            </p>
          </div>
        </section>

        {/* ---------------- Product tour ---------------- */}
        <section id="product" className="relative scroll-mt-24 overflow-hidden bg-ink-950">
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div className="absolute inset-0 bg-[radial-gradient(900px_420px_at_50%_0%,rgba(57,118,90,0.28),transparent_70%)]" />
            <div className="absolute inset-0 [background-image:linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_10%,black_30%,transparent_100%)]" />
          </div>

          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <Eyebrow tone="dark">Product tour</Eyebrow>
              <h2 className="font-display mt-2 text-balance text-2xl font-bold tracking-[-0.02em] text-white sm:text-[2rem]">
                Look inside before you ask anyone to use it
              </h2>
              <p className="mt-2.5 text-[15px] leading-relaxed text-neutral-400">
                The actual admin and staff screens. Nothing hidden behind a sales call.
              </p>
            </div>

            <div className="mt-9 sm:mt-11">
              <ProductTour />
            </div>
          </div>
        </section>

        {/* ---------------- Features ---------------- */}
        <section id="features" className="scroll-mt-24 border-b border-neutral-200/70 bg-secondary/40">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div className="max-w-2xl">
                <Eyebrow>Features</Eyebrow>
                <h2 className="font-display mt-2 text-balance text-2xl font-bold tracking-[-0.02em] sm:text-[2rem]">
                  Everything attendance needs. Nothing it doesn&apos;t.
                </h2>
                <p className="mt-2.5 text-[15px] leading-relaxed text-neutral-500">
                  Built for the admin who closes the month, and effortless for the person at the door.
                </p>
              </div>
              <Link
                href="/login"
                className="group inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-card px-4 py-2.5 text-sm font-semibold text-neutral-700 shadow-xs transition hover:border-brand-300 hover:text-brand-700"
              >
                Sign in to your workspace
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </div>

            <Reveal className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
              {features.map((feature) => (
                <FeatureCard key={feature.title} feature={feature} />
              ))}
            </Reveal>
          </div>
        </section>

        {/* ---------------- Rules engine ---------------- */}
        <section id="rules" className="scroll-mt-24 border-b border-neutral-200/70">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="max-w-2xl">
              <Eyebrow>Rules engine</Eyebrow>
              <h2 className="font-display mt-2 text-balance text-2xl font-bold tracking-[-0.02em] sm:text-[2rem]">
                Same rules for everyone, every day
              </h2>
              <p className="mt-2.5 text-[15px] leading-relaxed text-neutral-500">
                Statuses are computed from your organization&apos;s settings — start time, grace minutes,
                working days and timezone. Past records are never re-judged when a rule changes.
              </p>
            </div>

            <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {statuses.map((status) => (
                <div
                  key={status.value}
                  className="flex items-start gap-3 rounded-xl border border-neutral-200/80 bg-card px-4 py-3.5 shadow-xs"
                >
                  <StatusBadge value={status.value} size="sm" className="mt-0.5 shrink-0" />
                  <p className="text-[13px] leading-relaxed text-neutral-500">{status.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 overflow-hidden rounded-2xl border border-neutral-200/80 bg-card shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200/80 bg-neutral-50/80 px-5 py-3.5">
                <h3 className="font-display flex items-center gap-2 text-[14px] font-semibold tracking-tight">
                  <ClipboardCheck className="h-4 w-4 text-brand-600" aria-hidden />
                  The paper register, replaced
                </h3>
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
                  Before → After
                </span>
              </div>
              <ul className="divide-y divide-neutral-100">
                {comparison.map((row) => (
                  <li key={row.after} className="grid gap-2 px-5 py-4 sm:grid-cols-2 sm:gap-6">
                    <p className="flex items-start gap-2 text-[13.5px] leading-relaxed text-neutral-500">
                      <span className="mt-0.5 shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-neutral-500 sm:hidden">
                        Before
                      </span>
                      <span className="sm:line-through sm:decoration-neutral-300">{row.before}</span>
                    </p>
                    <p className="flex items-start gap-2 text-[13.5px] font-medium leading-relaxed text-neutral-800">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                      {row.after}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ---------------- Roles ---------------- */}
        <section id="roles" className="scroll-mt-24 border-b border-neutral-200/70 bg-secondary/40">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="max-w-2xl">
              <Eyebrow>Roles</Eyebrow>
              <h2 className="font-display mt-2 text-balance text-2xl font-bold tracking-[-0.02em] sm:text-[2rem]">
                One platform, three workspaces
              </h2>
              <p className="mt-2.5 text-[15px] leading-relaxed text-neutral-500">
                Everyone sees exactly what their role allows — enforced on the server, not just hidden in the UI.
              </p>
            </div>

            <div className="mt-9 grid gap-4 md:grid-cols-3">
              {roles.map((role, index) => (
                <Reveal key={role.title} delay={index * 90} className="h-full">
                  <div
                    className={cn(
                      "relative flex h-full flex-col rounded-2xl border p-5 transition sm:p-6",
                      index === 1
                        ? "border-brand-200 bg-card shadow-card ring-1 ring-brand-200/60"
                        : "border-neutral-200/80 bg-card shadow-soft hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                        <role.icon className="h-5 w-5" aria-hidden />
                      </span>
                      {index === 1 && (
                        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700 ring-1 ring-brand-600/15">
                          Day-to-day
                        </span>
                      )}
                    </div>
                    <h3 className="font-display mt-4 text-[15px] font-semibold tracking-tight">{role.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{role.desc}</p>
                    <ul className="mt-auto space-y-2 border-t border-neutral-100 pt-4 text-[13px] font-medium text-neutral-600">
                      {role.points.map((point) => (
                        <li key={point} className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- Pricing ---------------- */}
        <section id="pricing" className="scroll-mt-24 border-b border-neutral-200/70 bg-secondary/40">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <Eyebrow>Pricing</Eyebrow>
              <h2 className="font-display mt-2 text-balance text-2xl font-bold tracking-[-0.02em] sm:text-[2rem]">
                Straightforward plans. Real limits.
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-neutral-500">
                Every plan includes the full attendance core — QR clock-in, live monitoring, present/absent/late
                tracking and reports. Higher plans add capacity, deeper analytics and organisation-wide control.
                Prices are in Ghana cedis, billed monthly.
              </p>
            </div>

            <div className="mt-10 grid items-stretch gap-5 lg:grid-cols-3">
              {plans.map((plan, index) => (
                <Reveal key={plan.id} delay={index * 80} className="h-full">
                  <div
                    className={cn(
                      "relative flex h-full flex-col rounded-2xl border bg-card p-6 shadow-soft transition",
                      plan.featured
                        ? "border-brand-300 shadow-card ring-1 ring-brand-200 lg:-my-2 lg:p-7"
                        : "border-neutral-200/80 hover:border-brand-200"
                    )}
                  >
                    {plan.featured && (
                      <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-brand-700 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-white shadow-sm">
                        <Sparkles className="h-3 w-3" aria-hidden /> Best for growing teams
                      </span>
                    )}

                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-lg font-bold tracking-[-0.02em]">{plan.name}</h3>
                        <p className="mt-1 text-[13px] leading-snug text-neutral-500">{plan.tagline}</p>
                      </div>
                      <span
                        className={cn(
                          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                          plan.featured ? "bg-brand-700 text-white" : "bg-brand-50 text-brand-700"
                        )}
                        aria-hidden
                      >
                        <Clock className="h-[18px] w-[18px]" />
                      </span>
                    </div>

                    <div className="mt-5 flex items-baseline gap-1.5">
                      <span className="font-display text-[2rem] font-bold leading-none tracking-[-0.04em] tabular">
                        GH₵{plan.priceGhs.toLocaleString("en-GH")}
                      </span>
                      <span className="text-[13px] font-medium text-neutral-500">/month</span>
                    </div>

                    <ul className="mt-4 space-y-1.5">
                      {plan.limits.map((limit) => (
                        <li key={limit} className="flex items-start gap-2 text-[13px] font-semibold text-neutral-800">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden />
                          {limit}
                        </li>
                      ))}
                    </ul>

                    <div className="my-5 h-px bg-neutral-100" />

                    <ul className="flex-1 space-y-2">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-[13px] leading-snug text-neutral-600">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500/80" aria-hidden />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <a
                      href={REQUEST_HREF}
                      className={cn(
                        "mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition active:scale-[0.98]",
                        plan.featured
                          ? "bg-brand-700 text-white shadow-sm hover:bg-brand-600"
                          : "border border-neutral-200 bg-card text-neutral-800 hover:border-brand-200 hover:text-brand-700"
                      )}
                    >
                      Request a workspace
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </a>
                  </div>
                </Reveal>
              ))}
            </div>

            <div className="mt-14">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-bold tracking-[-0.02em]">Compare plans</h3>
                  <p className="mt-1 text-[13.5px] text-neutral-500">
                    The differences that matter, without the asterisks.
                  </p>
                </div>
                <span className="text-[12px] font-medium text-neutral-500">Prices exclude VAT where applicable</span>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200/80 bg-card shadow-soft">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-neutral-100 bg-secondary/60 text-[11.5px] uppercase tracking-wide text-neutral-500">
                        <th scope="col" className="px-5 py-3 font-semibold">
                          Feature
                        </th>
                        <th scope="col" className="px-5 py-3 text-center font-semibold">
                          Starter
                        </th>
                        <th scope="col" className="bg-brand-50/60 px-5 py-3 text-center font-semibold text-brand-800">
                          Growth
                        </th>
                        <th scope="col" className="px-5 py-3 text-center font-semibold">
                          Business
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {planMatrix.map((row) => (
                        <tr key={row.label} className="border-b border-neutral-100 last:border-0">
                          <th scope="row" className="px-5 py-3 text-left font-medium text-neutral-700">
                            {row.label}
                          </th>
                          <MatrixCell value={row.starter} />
                          <MatrixCell value={row.growth} highlight />
                          <MatrixCell value={row.business} />
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="mt-4 max-w-3xl text-[12.5px] leading-relaxed text-neutral-500">
                Limits are enforced on the server — staff seats, branches, managers and the attendance history
                window all come from your plan. Downgrading restricts access to older records without deleting
                anything.
              </p>
            </div>
          </div>
        </section>

        {/* ---------------- Security ---------------- */}
        <section id="security" className="scroll-mt-24 border-b border-neutral-200/70">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
              <div>
                <Eyebrow>Security</Eyebrow>
                <h2 className="font-display mt-2 text-balance text-2xl font-bold tracking-[-0.02em] sm:text-[2rem]">
                  Secure by design, not by promise
                </h2>
                <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-neutral-500">
                  HTTP-only sessions, hashed single-use tokens, server-side timestamps, tenant isolation on
                  every query, rate limiting and immutable audit logs. The record is the record.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={REQUEST_HREF}
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 active:scale-[0.98]"
                  >
                    Request a workspace
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </a>
                  <Link
                    href="/privacy"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-card px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:border-brand-200 hover:text-brand-700"
                  >
                    Read the privacy policy
                  </Link>
                </div>
              </div>

              <Reveal delay={120}>
                <ul className="grid gap-3 rounded-3xl border border-neutral-200/80 bg-secondary/50 p-5 shadow-soft sm:grid-cols-2 sm:p-6">
                  {securityItems.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2.5 rounded-xl border border-neutral-200/80 bg-card px-4 py-3 text-[13px] font-medium shadow-xs transition hover:border-brand-200"
                    >
                      <ShieldCheck className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ---------------- FAQ ---------------- */}
        <section id="faq" className="scroll-mt-24">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="text-center">
              <Eyebrow>FAQ</Eyebrow>
              <h2 className="font-display mt-2 text-2xl font-bold tracking-[-0.02em] sm:text-[2rem]">
                Honest answers
              </h2>
              <p className="mt-2.5 text-[15px] text-neutral-500">
                Including the things the QR code does not prove.
              </p>
            </div>

            <div className="mt-9 space-y-3">
              {faqs.map((faq, index) => (
                <Reveal key={faq.q} delay={index * 60}>
                  <details className="group rounded-2xl border border-neutral-200/80 bg-card px-5 py-4 shadow-soft transition open:border-brand-200 open:shadow-card">
                    <summary className="cursor-pointer list-none text-[14px] font-semibold tracking-tight [&::-webkit-details-marker]:hidden">
                      <span className="flex items-center justify-between gap-3">
                        {faq.q}
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition duration-200 group-open:rotate-45 group-open:bg-brand-700 group-open:text-white">
                          +
                        </span>
                      </span>
                    </summary>
                    <p className="mt-3 border-t border-neutral-100 pt-3 text-[13.5px] leading-relaxed text-neutral-500">
                      {faq.a}
                    </p>
                  </details>
                </Reveal>
              ))}
            </div>

            <p className="mt-7 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[13px] text-neutral-500">
              Still unsure?
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex items-center gap-1.5 font-semibold text-brand-700 underline decoration-brand-300 underline-offset-4 transition hover:text-brand-600 hover:decoration-brand-500"
              >
                <Mail className="h-3.5 w-3.5" aria-hidden />
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>
        </section>

        {/* ---------------- Closing CTA ---------------- */}
        <section className="border-t border-neutral-200/70">
          <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pb-20">
            <Reveal>
              <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[28px] border border-brand-100 bg-brand-50 px-6 py-12 shadow-lift sm:px-12 sm:py-14">
                <div className="pointer-events-none absolute inset-0" aria-hidden>
                  <div className="absolute inset-0 [background-image:linear-gradient(to_right,rgba(57,118,90,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(57,118,90,0.07)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_60%_80%_at_50%_50%,black,transparent)]" />
                  <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-brand-100 blur-3xl" />
                  <div className="absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-white/80 blur-3xl" />
                </div>

                <div className="relative mx-auto max-w-2xl text-center">
                  <span className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-700 shadow-sm">
                    <LogoMark className="h-6 w-6" square={false} tone="light" />
                  </span>
                  <h2 className="font-display mt-4 text-balance text-2xl font-bold tracking-[-0.02em] text-neutral-900 sm:text-[1.9rem]">
                    Bring your team onto ChronoSwift
                  </h2>
                  <p className="mx-auto mt-2.5 max-w-lg text-[14.5px] leading-relaxed text-neutral-600">
                    Tell us about your organization. We&apos;ll provision your workspace and email your admin
                    a secure setup link — usually within one business day.
                  </p>
                  <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <a
                      href={REQUEST_HREF}
                      className="group inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-6 py-3.5 text-sm font-semibold text-white shadow-lift transition hover:bg-brand-600 active:scale-[0.98]"
                    >
                      Request a workspace
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </a>
                    <Link
                      href="/login"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-6 py-3.5 text-sm font-semibold text-neutral-800 shadow-xs transition hover:border-brand-300 hover:text-brand-700"
                    >
                      Sign in
                    </Link>
                  </div>
                  <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12.5px] font-medium text-brand-800">
                    <li className="inline-flex items-center gap-1.5">
                      <ScanLine className="h-3.5 w-3.5" aria-hidden /> No hardware
                    </li>
                    <li className="inline-flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5" aria-hidden /> Live from day one
                    </li>
                    <li className="inline-flex items-center gap-1.5">
                      <BarChart3 className="h-3.5 w-3.5" aria-hidden /> Reports from real records
                    </li>
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-200/70 bg-card">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-9 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <Logo size="md" />
              <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-neutral-500">
                Smart attendance. Simple management. QR clock-in, automatic rules and reports your payroll
                team can use.
              </p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-600 transition hover:text-brand-700"
              >
                <Mail className="h-3.5 w-3.5" aria-hidden />
                {CONTACT_EMAIL}
              </a>
            </div>

            <nav aria-label="Product" className="text-[13px]">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">Product</h2>
              <ul className="mt-3 space-y-2.5 font-medium">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="text-neutral-600 transition hover:text-neutral-900">
                      {link.label}
                    </a>
                  </li>
                ))}
                <li>
                  <a href="#security" className="text-neutral-600 transition hover:text-neutral-900">
                    Security
                  </a>
                </li>
              </ul>
            </nav>

            <nav aria-label="Company" className="text-[13px]">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">Company</h2>
              <ul className="mt-3 space-y-2.5 font-medium">
                <li>
                  <Link href="/login" className="text-neutral-600 transition hover:text-neutral-900">
                    Sign in
                  </Link>
                </li>
                <li>
                  <a href={REQUEST_HREF} className="text-neutral-600 transition hover:text-neutral-900">
                    Request a workspace
                  </a>
                </li>
                <li>
                  <Link href="/terms" className="text-neutral-600 transition hover:text-neutral-900">
                    Terms of service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-neutral-600 transition hover:text-neutral-900">
                    Privacy policy
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-neutral-200/70 pt-6 text-[12.5px] text-neutral-500 md:flex-row">
            <p>© {new Date().getFullYear()} ChronoSwift. All rights reserved.</p>
            <p>
              Created by{" "}
              <a
                href="https://samtechlabs.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-4 transition hover:text-brand-600 hover:decoration-brand-500"
              >
                SamTech Labs
              </a>
            </p>
          </div>
        </div>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function MatrixCell({
  value,
  highlight,
}: {
  value: string | boolean;
  highlight?: boolean;
}) {
  return (
    <td
      className={cn(
        "px-5 py-3 text-center align-middle",
        highlight && "bg-brand-50/40",
        typeof value === "string" ? "font-medium text-neutral-700" : ""
      )}
    >
      {typeof value === "boolean" ? (
        value ? (
          <Check className="mx-auto h-4 w-4 text-brand-600" aria-label="Included" />
        ) : (
          <span className="text-neutral-300" aria-label="Not included">
            —
          </span>
        )
      ) : (
        value
      )}
    </td>
  );
}

function Eyebrow({ children, tone = "light" }: { children: ReactNode; tone?: "light" | "dark" }) {
  return (
    <p
      className={cn(
        "text-[11px] font-bold uppercase tracking-[0.16em]",
        tone === "dark" ? "text-brand-300" : "text-brand-600"
      )}
    >
      {children}
    </p>
  );
}

type Feature = (typeof features)[number];

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-card p-5 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card sm:p-6",
        feature.span
      )}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-brand-100/0 blur-2xl transition duration-300 group-hover:bg-brand-100/60"
        aria-hidden
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm transition duration-200 group-hover:scale-105 group-hover:bg-brand-700">
          <feature.icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[15px] font-semibold tracking-tight">{feature.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{feature.desc}</p>
        </div>
      </div>

      <div className="relative mt-4">
        <FeatureVisual kind={feature.visual} />
      </div>
    </div>
  );
}

function FeatureVisual({ kind }: { kind: Feature["visual"] }) {
  if (kind === "qr") {
    return (
      <div aria-hidden className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50/70 p-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-white ring-1 ring-neutral-200">
          <QrCode className="h-10 w-10 text-ink-950" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[11.5px] font-semibold text-neutral-800">Scan at Main Office</div>
          <div className="truncate text-[10px] text-neutral-400">Acme Technologies · /attendance/scan</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <span className="rounded bg-white px-1.5 py-0.5 text-[9.5px] font-semibold text-neutral-600 ring-1 ring-neutral-200">
              Printed
            </span>
            <span className="rounded bg-white px-1.5 py-0.5 text-[9.5px] font-semibold text-neutral-600 ring-1 ring-neutral-200">
              Rotate kills old copies
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (kind === "isolation") {
    return (
      <div aria-hidden className="flex items-stretch gap-2 rounded-xl border border-neutral-100 bg-neutral-50/70 p-3">
        <div className="flex-1 rounded-lg border border-brand-100 bg-white px-2.5 py-2">
          <div className="text-[9.5px] font-bold uppercase tracking-wider text-brand-700">Org A</div>
          <div className="mt-1 space-y-1">
            <div className="h-1.5 w-4/5 rounded-full bg-brand-100" />
            <div className="h-1.5 w-3/5 rounded-full bg-brand-100" />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-1 px-0.5">
          <Lock className="h-3.5 w-3.5 text-neutral-400" />
          <span className="text-[8px] font-bold uppercase tracking-wider text-neutral-400">No access</span>
        </div>
        <div className="flex-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-2">
          <div className="text-[9.5px] font-bold uppercase tracking-wider text-neutral-500">Org B</div>
          <div className="mt-1 space-y-1">
            <div className="h-1.5 w-4/5 rounded-full bg-neutral-200" />
            <div className="h-1.5 w-3/5 rounded-full bg-neutral-200" />
          </div>
        </div>
      </div>
    );
  }

  if (kind === "late") {
    return (
      <div aria-hidden className="rounded-xl border border-neutral-100 bg-neutral-50/70 p-3">
        <div className="flex items-center justify-between text-[9.5px] font-semibold">
          <span className="inline-flex items-center gap-1 text-neutral-500">
            <Clock className="h-3 w-3" /> 08:00 start
          </span>
          <span className="inline-flex items-center gap-1 text-neutral-500">
            08:15 grace
          </span>
          <span className="inline-flex items-center gap-1 text-amber-700">
            <AlarmClock className="h-3 w-3" /> 08:16 late
          </span>
        </div>
        <div className="relative mt-2.5 h-1.5 rounded-full bg-neutral-200">
          <div className="absolute inset-y-0 left-0 w-[62%] rounded-full bg-brand-400" />
          <div className="absolute inset-y-0 left-[62%] right-0 rounded-full bg-amber-400" />
          <span className="absolute -top-1 left-[62%] h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-white bg-amber-500" />
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[9.5px] font-medium text-neutral-400">
          <CheckCircle2 className="h-3 w-3 text-brand-500" /> Applied per organization · never retroactive
        </div>
      </div>
    );
  }

  if (kind === "staff") {
    return (
      <div aria-hidden className="flex flex-wrap items-center gap-1.5 rounded-xl border border-neutral-100 bg-neutral-50/70 p-3">
        <span className="rounded-md bg-amber-50 px-2 py-1 text-[9.5px] font-bold uppercase tracking-wider text-amber-700 ring-1 ring-amber-200/70">
          Invited
        </span>
        <ArrowRight className="h-3 w-3 text-neutral-300" />
        <span className="rounded-md bg-brand-50 px-2 py-1 text-[9.5px] font-bold uppercase tracking-wider text-brand-700 ring-1 ring-brand-200/70">
          Active
        </span>
        <ArrowRight className="h-3 w-3 text-neutral-300" />
        <span className="rounded-md bg-neutral-100 px-2 py-1 text-[9.5px] font-bold uppercase tracking-wider text-neutral-500 ring-1 ring-neutral-200">
          Disabled
        </span>
        <span className="ml-auto text-[9.5px] font-medium text-neutral-400">History kept</span>
      </div>
    );
  }

  if (kind === "reports") {
    return (
      <div aria-hidden className="flex items-end gap-3 rounded-xl border border-neutral-100 bg-neutral-50/70 p-3">
        <div className="flex h-12 flex-1 items-end gap-1">
          {[42, 58, 36, 74, 66, 88, 52].map((height, index) => (
            <span
              key={index}
              className="flex-1 rounded-sm bg-brand-200 last:bg-brand-600"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Export</div>
          <div className="mt-1 rounded bg-white px-2 py-1 text-[9.5px] font-semibold text-neutral-600 ring-1 ring-neutral-200">
            CSV · hours computed
          </div>
        </div>
      </div>
    );
  }

  return (
    <div aria-hidden className="grid gap-1.5 rounded-xl border border-neutral-100 bg-neutral-50/70 p-3 sm:grid-cols-3">
      {[
        { time: "12:04", text: "QR rotated · Main Office", who: "Ama M." },
        { time: "08:31", text: "Record corrected · reason attached", who: "Ama M." },
        { time: "07:58", text: "Clock-in · Warehouse B", who: "Kwame B." },
      ].map((entry) => (
        <div
          key={entry.time}
          className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-2 ring-1 ring-neutral-200/70"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600">
            <BellRing className="h-3 w-3" />
          </span>
          <div className="min-w-0">
            <div className="truncate text-[10px] font-semibold text-neutral-700">{entry.text}</div>
            <div className="truncate text-[9px] text-neutral-400">
              <span className="tabular">{entry.time}</span> · {entry.who} · logged
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
