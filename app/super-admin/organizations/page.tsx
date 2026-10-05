import { requireSuperAdmin } from "@/lib/auth/permissions";
import { dbConnect } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { AppShell } from "@/components/dashboard/shell";
import { SUPER_ADMIN_NAV } from "@/lib/dashboard-helpers";
import OrgsPage from "./page-inner";

export default async function Page() {
  const s = await requireSuperAdmin();
  await dbConnect();
  const me = (await User.findById(s.sub).lean()) as unknown as {
    firstName: string;
    lastName: string;
  } | null;
  return (
    <AppShell
      title="Organizations"
      subtitle="Tenants on the ChronoSwift platform"
      userName={me ? `${me.firstName} ${me.lastName}` : "Super Admin"}
      role="SUPER_ADMIN"
      nav={SUPER_ADMIN_NAV}
    >
      <OrgsPage />
    </AppShell>
  );
}
