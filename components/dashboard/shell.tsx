"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  QrCode,
  BarChart3,
  Settings,
  ScrollText,
  Building2,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon?: string;
}

const ICONS: Record<string, typeof LayoutDashboard> = {
  Overview: LayoutDashboard,
  Attendance: CalendarCheck,
  Staff: Users,
  "QR Codes": QrCode,
  Reports: BarChart3,
  Settings: Settings,
  "Audit Logs": ScrollText,
  Organizations: Building2,
  Activity: ScrollText,
  Today: LayoutDashboard,
  History: CalendarCheck,
  Profile: Users,
};

export function AppShell({
  title,
  subtitle,
  orgName,
  userName,
  userEmail,
  role,
  nav,
  children,
}: {
  title: string;
  subtitle?: string;
  orgName?: string;
  userName: string;
  userEmail?: string;
  role: string;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const isActive = (href: string) => path === href || path.startsWith(href + "/");
  const initials = userName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const navList = (
    <nav className="flex-1 space-y-1 overflow-y-auto p-3">
      {nav.map((n) => {
        const Icon = ICONS[n.label] ?? LayoutDashboard;
        const active = isActive(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={() => setOpen(false)}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all",
              active
                ? "bg-neutral-900 text-white shadow-soft"
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            )}
          >
            <Icon className={cn("h-[18px] w-[18px]", active ? "text-white" : "text-neutral-400 group-hover:text-neutral-700")} />
            {n.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-[#F6F7F9]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col border-r border-neutral-200/70 bg-white md:flex">
        <div className="flex items-center gap-3 border-b border-neutral-100 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-[16px] text-white">◷</div>
          <div className="min-w-0">
            <div className="text-[15px] font-bold leading-none tracking-tight">Chrono</div>
            {orgName && <div className="mt-1 max-w-[160px] truncate text-[11.5px] font-medium text-neutral-500">{orgName}</div>}
          </div>
        </div>
        {navList}
        <div className="border-t border-neutral-100 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-neutral-50 px-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold">{userName}</div>
              <div className="text-[11px] capitalize text-neutral-500">{role.replace(/_/g, " ").toLowerCase()}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-[280px] animate-[fade-up_0.2s_ease] flex-col bg-white shadow-lift">
            <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white">◷</div>
                <span className="font-bold">Chrono</span>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-neutral-100" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            {navList}
            <div className="border-t border-neutral-100 p-3">
              <button onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-neutral-600 hover:bg-neutral-100">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 border-b border-neutral-200/70 bg-white/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
            <button onClick={() => setOpen(true)} className="rounded-xl border border-neutral-200 p-2 md:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[15px] font-semibold tracking-tight sm:text-base">{title}</h1>
              {subtitle && <p className="hidden truncate text-[12.5px] text-neutral-500 sm:block">{subtitle}</p>}
            </div>
            <div className="hidden items-center gap-3 md:flex">
              {orgName && (
                <span className="max-w-[220px] truncate rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-600">
                  {orgName}
                </span>
              )}
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white" title={userEmail || userName}>
                {initials}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-5 sm:px-6 sm:pt-7 md:pb-10">
          <div className="stagger">{children}</div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200/80 bg-white/95 backdrop-blur-md md:hidden">
          <div className="mx-auto grid max-w-lg auto-cols-fr grid-flow-col px-2 py-1.5">
            {nav.slice(0, 5).map((n) => {
              const Icon = ICONS[n.label] ?? LayoutDashboard;
              const active = isActive(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10.5px] font-semibold",
                    active ? "text-neutral-900" : "text-neutral-400"
                  )}
                >
                  <span className={cn("flex h-8 w-12 items-center justify-center rounded-full", active && "bg-neutral-900 text-white")}>
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  {n.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
