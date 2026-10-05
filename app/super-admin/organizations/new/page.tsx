import { requireSuperAdmin } from "@/lib/auth/permissions";
import { dbConnect } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { AppShell } from "@/components/dashboard/shell";
import NewOrgForm from "./form";

export default async function Page() {
  const s = await requireSuperAdmin();
  await dbConnect();
  const me = await User.findById(s.sub).lean() as unknown as { firstName: string; lastName: string } | null;
  return (
    <AppShell title="Create organization" userName={me ? `${me.firstName} ${me.lastName}` : "Super Admin"} role="SUPER_ADMIN"
      nav={[{ href: "/super-admin", label: "Overview" }, { href: "/super-admin/organizations", label: "Organizations" }, { href: "/super-admin/audit", label: "Activity" }]}>
      <NewOrgForm />
    </AppShell>
  );
}
