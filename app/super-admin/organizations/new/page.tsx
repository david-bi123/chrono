import { requireSuperAdmin } from "@/lib/auth/permissions";
import { dbConnect } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { AppShell } from "@/components/dashboard/shell";
import { SUPER_ADMIN_NAV } from "@/lib/dashboard-helpers";
import { PageHeader } from "@/components/ui/page-header";
import NewOrgForm from "./form";

export default async function Page() {
  const s = await requireSuperAdmin();
  await dbConnect();
  const me = (await User.findById(s.sub).lean()) as unknown as {
    firstName: string;
    lastName: string;
  } | null;
  return (
    <AppShell
      title="Create organization"
      subtitle="Provision a new tenant"
      userName={me ? `${me.firstName} ${me.lastName}` : "Super Admin"}
      role="SUPER_ADMIN"
      nav={SUPER_ADMIN_NAV}
    >
      <div className="space-y-5">
        <PageHeader
          title="Create organization"
          description="Sets up the tenant, its administrator and a single-use 72-hour setup link sent by email."
        />
        <NewOrgForm />
      </div>
    </AppShell>
  );
}
