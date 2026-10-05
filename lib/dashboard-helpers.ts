import { getSession } from "@/lib/auth/session";
import { dbConnect } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { Organization } from "@/models/Organization";
import { redirect } from "next/navigation";

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

export const ORG_NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/attendance", label: "Attendance" },
  { href: "/dashboard/staff", label: "Staff" },
  { href: "/dashboard/qr", label: "QR Codes" },
  { href: "/dashboard/reports", label: "Reports" },
  { href: "/dashboard/settings", label: "Settings" },
  { href: "/dashboard/audit-logs", label: "Audit Logs" },
];

export const STAFF_NAV = [
  { href: "/staff", label: "Today" },
  { href: "/staff/history", label: "History" },
  { href: "/staff/profile", label: "Profile" },
];
