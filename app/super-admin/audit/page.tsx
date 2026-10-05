import { requireSuperAdmin } from "@/lib/auth/permissions";
import { dbConnect } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { AppShell } from "@/components/dashboard/shell";
import { SUPER_ADMIN_NAV } from "@/lib/dashboard-helpers";
import { PageHeader } from "@/components/ui/page-header";
import { AuditFeed } from "@/components/dashboard/audit-feed";

export default async function Page() {
  const s = await requireSuperAdmin();
  await dbConnect();
  const me = (await User.findById(s.sub).lean()) as unknown as {
    firstName: string;
    lastName: string;
  } | null;
  return (
    <AppShell
      title="Activity"
      subtitle="Platform-wide audit trail"
      userName={me ? `${me.firstName} ${me.lastName}` : "Super Admin"}
      role="SUPER_ADMIN"
      nav={SUPER_ADMIN_NAV}
    >
      <div className="space-y-5">
        <PageHeader
          title="Platform activity"
          description="Cross-tenant actions recorded across ChronoSwift, with actor context and IP address."
        />
        <AuditFeed title="Activity feed" description="The most recent platform events, newest first." />
      </div>
    </AppShell>
  );
}
