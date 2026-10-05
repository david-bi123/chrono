import { requireSuperAdmin } from "@/lib/auth/permissions";
import { dbConnect } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { AppShell } from "@/components/dashboard/shell";
import { SUPER_ADMIN_NAV } from "@/lib/dashboard-helpers";
import SuperAdminHome from "./home-inner";

export default async function SuperAdminHome_() {
  const s = await requireSuperAdmin();
  await dbConnect();
  const me = (await User.findById(s.sub).lean()) as unknown as {
    firstName: string;
    lastName: string;
  } | null;

  return (
    <AppShell
      title="Platform overview"
      subtitle="Organizations, users and platform activity"
      userName={me ? `${me.firstName} ${me.lastName}` : "Super Admin"}
      role="SUPER_ADMIN"
      nav={SUPER_ADMIN_NAV}
    >
      <SuperAdminHome />
    </AppShell>
  );
}
