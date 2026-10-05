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
  UserRound,
  History,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Logo, LogoMark } from "@/components/brand/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";

export interface NavItem {
  href: string;
  label: string;
  /** Optional icon key (see ICONS). Falls back to a label lookup. */
  icon?: string;
  /** Optional section — items under "admin" render in a secondary group. */
  group?: "main" | "admin";
}

const ICONS: Record<string, LucideIcon> = {
  Overview: LayoutDashboard,
  overview: LayoutDashboard,
  Attendance: CalendarCheck,
  attendance: CalendarCheck,
  Staff: Users,
  staff: Users,
  "QR Codes": QrCode,
  "QR Locations": QrCode,
  qr: QrCode,
  Reports: BarChart3,
  reports: BarChart3,
  Settings: Settings,
  settings: Settings,
  "Audit Logs": ScrollText,
  Activity: ScrollText,
  Organizations: Building2,
  Today: LayoutDashboard,
  History: History,
  Profile: UserRound,
};

const GROUP_LABELS: Record<string, string> = {
  main: "Workspace",
  admin: "Administration",
};

function navIcon(item: NavItem): LucideIcon {
  if (item.icon && ICONS[item.icon]) return ICONS[item.icon];
  if (ICONS[item.label]) return ICONS[item.label];
  return LayoutDashboard;
}

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
  const firstName = userName.split(" ")[0] || userName;
  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const roleLabel = role.replace(/_/g, " ").toLowerCase();

  const mainNav = nav.filter((n) => n.group !== "admin");
  const adminNav = nav.filter((n) => n.group === "admin");
  const activeItem = nav.find((n) => isActive(n.href));

  const settingsHref =
    role === "ORGANIZATION_ADMIN"
      ? "/dashboard/settings"
      : role === "STAFF"
        ? "/staff/profile"
        : null;

  const renderItem = (n: NavItem) => {
    const Icon = navIcon(n);
    const active = isActive(n.href);
    return (
      <Link
        key={n.href}
        href={n.href}
        onClick={() => setOpen(false)}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors duration-150",
          active
            ? "bg-brand-50 text-brand-700 before:absolute before:-left-3 before:top-1/2 before:h-4 before:w-[3px] before:-translate-y-1/2 before:rounded-r-full before:bg-brand-600"
            : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
        )}
      >
        <Icon
          className={cn(
            "h-[17px] w-[17px] shrink-0 transition-colors",
            active ? "text-brand-600" : "text-neutral-500 group-hover:text-neutral-600"
          )}
          strokeWidth={2}
          aria-hidden
        />
        <span className="truncate">{n.label}</span>
      </Link>
    );
  };

  const navList = (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Main">
      <div className="space-y-1">
        <div className="px-3 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-neutral-500">
          {GROUP_LABELS.main}
        </div>
        <div className="space-y-0.5">{mainNav.map(renderItem)}</div>
      </div>
      {adminNav.length > 0 && (
        <div className="space-y-1">
          <div className="px-3 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-neutral-500">
            {GROUP_LABELS.admin}
          </div>
          <div className="space-y-0.5">{adminNav.map(renderItem)}</div>
        </div>
      )}
    </nav>
  );

  const sidebarFooter = (
    <div className="border-t border-neutral-100 p-3">
      <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
        <Avatar name={userName} email={userEmail} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-neutral-900">{userName}</div>
          <div className="truncate text-[11.5px] capitalize text-neutral-500">{roleLabel}</div>
        </div>
        {settingsHref && (
          <Link
            href={settingsHref}
            className="rounded-md p-1.5 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Settings"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </Link>
        )}
        <button
          onClick={logout}
          className="rounded-md p-1.5 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-700"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const userMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-lg p-1 transition hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
          aria-label="Account menu"
        >
          <Avatar name={userName} email={userEmail} size="sm" />
          <ChevronDown className="hidden h-4 w-4 text-neutral-500 sm:block" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60">
        <div className="flex items-center gap-2.5 px-2.5 py-2.5">
          <Avatar name={userName} email={userEmail} size="sm" />
          <div className="min-w-0">
            <div className="truncate text-[13.5px] font-semibold text-neutral-900">{userName}</div>
            <div className="truncate text-[12px] text-neutral-500">{userEmail || orgName}</div>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="capitalize">{roleLabel}</DropdownMenuLabel>
        {settingsHref && (
          <DropdownMenuItem onSelect={() => router.push(settingsHref)}>
            <Settings className="h-4 w-4 text-neutral-500" /> Settings
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => router.push("/")}>
          <Building2 className="h-4 w-4 text-neutral-500" /> Home page
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={logout} className="text-red-600 focus:text-red-600">
          <LogOut className="h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const showBottomNav = nav.length <= 4;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-neutral-200/80 bg-white md:flex no-print">
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-neutral-100 px-5">
          <Logo size="md" />
          {orgName && (
            <span className="ml-auto max-w-[112px] truncate text-[12px] font-medium text-neutral-500" title={orgName}>
              {orgName}
            </span>
          )}
        </div>
        {navList}
        {sidebarFooter}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden no-print">
          <div
            className="absolute inset-0 bg-neutral-950/45 backdrop-blur-[2px] animate-overlay-in"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside
            className="absolute left-0 top-0 flex h-full w-[264px] flex-col bg-white shadow-lift animate-[fade-up_0.2s_ease]"
            role="dialog"
            aria-label="Navigation"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-100 px-5">
              <Logo size="md" />
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-neutral-500 transition hover:bg-neutral-100"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {navList}
            {sidebarFooter}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 border-b border-neutral-200/80 bg-white/85 backdrop-blur-md no-print">
          <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setOpen(true)}
              className="-ml-1.5 rounded-lg p-2 text-neutral-600 transition hover:bg-neutral-100 md:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="hidden min-w-0 items-center gap-2 text-[13px] md:flex">
              <span className="flex items-center gap-1.5 font-medium text-neutral-500">
                <LogoMark className="h-4 w-4" />
                ChronoSwift
              </span>
              <span className="text-neutral-300" aria-hidden>
                /
              </span>
              <span className="truncate font-medium text-neutral-700" aria-current="page">
                {activeItem?.label ?? title}
              </span>
              {activeItem && activeItem.label !== title && (
                <>
                  <span className="text-neutral-300" aria-hidden>
                    /
                  </span>
                  <span className="truncate font-medium text-neutral-700">{title}</span>
                </>
              )}
            </div>

            {/* Mobile brand */}
            <div className="flex items-center gap-2 md:hidden">
              <span className="text-[15px] font-semibold tracking-tight">ChronoSwift</span>
            </div>

            <div className="ml-auto flex items-center gap-2.5">
              {orgName && (
                <span
                  className="hidden max-w-[240px] truncate rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-[12.5px] font-medium text-neutral-600 lg:inline-flex"
                  title={orgName}
                >
                  {orgName}
                </span>
              )}
              {userMenu}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 pb-24 pt-6 sm:px-6 sm:pt-7 lg:px-8 md:pb-12">
          <div className="stagger">{children}</div>
        </main>

        {/* Mobile bottom nav — only when the IA fits comfortably */}
        {showBottomNav && (
          <nav
            className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200/80 bg-white/95 backdrop-blur-md md:hidden no-print"
            aria-label="Primary"
          >
            <div className="mx-auto grid max-w-lg auto-cols-fr grid-flow-col px-2 py-1.5">
              {nav.map((n) => {
                const Icon = navIcon(n);
                const active = isActive(n.href);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10.5px] font-semibold transition-colors",
                      active ? "text-brand-600" : "text-neutral-500"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                        active && "bg-brand-50"
                      )}
                    >
                      <Icon className="h-[17px] w-[17px]" strokeWidth={2} aria-hidden />
                    </span>
                    {n.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
