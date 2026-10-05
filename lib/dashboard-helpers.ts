import { getSession } from "@/lib/auth/session";
import { dbConnect } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { Organization } from "@/models/Organization";
import { redirect } from "next/navigation";
import type { NavItem } from "@/components/dashboard/shell";

export async function orgAdminContext() {
  const s = await getSession();
  if (!s || s.role !== "ORGANIZATION_ADMIN" || !s.orgId) redirect("/login");
  await dbConnect();
  const [me, org] = await Promise.all([
    User.findById(s.sub).lean(),
    Organization.findById(s.orgId).lean(),
  ]);
  const m = me as unknown as { firstName: string; lastName: string } | null;
  const o = org as unknown as { name: string } | null;
  return {
    session: s,
    userName: m ? `${m.firstName} ${m.lastName}` : "Admin",
    orgName: o?.name || "",
  };
}

export const ORG_NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: "Overview" },
  { href: "/dashboard/attendance", label: "Attendance", icon: "Attendance" },
  { href: "/dashboard/staff", label: "Staff", icon: "Staff" },
  { href: "/dashboard/qr", label: "QR Codes", icon: "QR Codes" },
  { href: "/dashboard/reports", label: "Reports", icon: "Reports" },
  { href: "/dashboard/settings", label: "Settings", icon: "Settings", group: "admin" },
  { href: "/dashboard/audit-logs", label: "Audit Logs", icon: "Audit Logs", group: "admin" },
];

export const STAFF_NAV: NavItem[] = [
  { href: "/staff", label: "Today", icon: "Today" },
  { href: "/staff/history", label: "History", icon: "History" },
  { href: "/staff/profile", label: "Profile", icon: "Profile" },
];

export const SUPER_ADMIN_NAV: NavItem[] = [
  { href: "/super-admin", label: "Overview", icon: "Overview" },
  { href: "/super-admin/organizations", label: "Organizations", icon: "Organizations" },
  { href: "/super-admin/audit", label: "Activity", icon: "Activity" },
];
