import { getSession } from "@/lib/auth/session";
import { dbConnect } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { Organization } from "@/models/Organization";
import { redirect } from "next/navigation";
import type { NavItem } from "@/components/dashboard/shell";

/**
 * Workspace context for the organisation app.
 *
 * Managers are a real role with read-only oversight of attendance, staff and
 * reports, so they get the same context as an admin minus the write screens.
 */
export async function orgWorkspaceContext() {
  const s = await getSession();
  if (!s || !["ORGANIZATION_ADMIN", "MANAGER"].includes(s.role) || !s.orgId) redirect("/login");
  await dbConnect();
  const [me, org] = await Promise.all([
    User.findById(s.sub).lean(),
    Organization.findById(s.orgId).lean(),
  ]);
  const m = me as unknown as { firstName: string; lastName: string; email?: string } | null;
  const o = org as unknown as { name: string } | null;
  return {
    session: s,
    role: s.role,
    isAdmin: s.role === "ORGANIZATION_ADMIN",
    userName: m ? `${m.firstName} ${m.lastName}` : "User",
    userEmail: m?.email,
    orgName: o?.name || "",
  };
}

/** Strict admin context — used by screens that mutate the workspace. */
export async function orgAdminContext() {
  const s = await getSession();
  if (!s || s.role !== "ORGANIZATION_ADMIN" || !s.orgId) redirect("/unauthorized");
  await dbConnect();
  const [me, org] = await Promise.all([
    User.findById(s.sub).lean(),
    Organization.findById(s.orgId).lean(),
  ]);
  const m = me as unknown as { firstName: string; lastName: string; email?: string } | null;
  const o = org as unknown as { name: string } | null;
  return {
    session: s,
    role: s.role as "ORGANIZATION_ADMIN",
    isAdmin: true,
    userName: m ? `${m.firstName} ${m.lastName}` : "Admin",
    userEmail: m?.email,
    orgName: o?.name || "",
  };
}

/** Navigation shown to the organisation administrator. */
export const ORG_NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: "Overview" },
  { href: "/dashboard/attendance", label: "Attendance", icon: "Attendance" },
  { href: "/dashboard/staff", label: "Staff", icon: "Staff" },
  { href: "/dashboard/managers", label: "Managers", icon: "Managers" },
  { href: "/dashboard/qr", label: "Branches", icon: "Branches" },
  { href: "/dashboard/reports", label: "Reports", icon: "Reports" },
  { href: "/dashboard/subscription", label: "Subscription", icon: "Subscription", group: "admin" },
  { href: "/dashboard/settings", label: "Settings", icon: "Settings", group: "admin" },
  { href: "/dashboard/audit-logs", label: "Audit Logs", icon: "Audit Logs", group: "admin" },
];

/** Managers see attendance, staff and reports — but never the write screens. */
export const MANAGER_NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: "Overview" },
  { href: "/dashboard/attendance", label: "Attendance", icon: "Attendance" },
  { href: "/dashboard/staff", label: "Staff", icon: "Staff" },
  { href: "/dashboard/qr", label: "Branches", icon: "Branches" },
  { href: "/dashboard/reports", label: "Reports", icon: "Reports" },
  { href: "/dashboard/subscription", label: "Subscription", icon: "Subscription", group: "admin" },
];

export const STAFF_NAV: NavItem[] = [
  { href: "/staff", label: "Today", icon: "Today" },
  { href: "/staff/clock", label: "Clock In", icon: "Clock In" },
  { href: "/staff/history", label: "History", icon: "History" },
  { href: "/staff/profile", label: "Profile", icon: "Profile" },
];

export const SUPER_ADMIN_NAV: NavItem[] = [
  { href: "/super-admin", label: "Overview", icon: "Overview" },
  { href: "/super-admin/organizations", label: "Organizations", icon: "Organizations" },
  { href: "/super-admin/audit", label: "Activity", icon: "Activity" },
];

/** Sidebar contents for the signed-in workspace role. */
export function navForRole(role: string): NavItem[] {
  return role === "MANAGER" ? MANAGER_NAV : ORG_NAV;
}
