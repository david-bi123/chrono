import { orgAdminContext, ORG_NAV } from "@/lib/dashboard-helpers";
import { AppShell } from "@/components/dashboard/shell";
import { PageHeader } from "@/components/ui/page-header";
import { AuditFeed } from "@/components/dashboard/audit-feed";

export default async function Page() {
  const ctx = await orgAdminContext();
  return (
    <AppShell
      title="Audit logs"
      subtitle="A permanent record of sensitive actions"
      userName={ctx.userName}
      orgName={ctx.orgName}
      role="ORGANIZATION_ADMIN"
      nav={ORG_NAV}
    >
      <div className="space-y-5">
        <PageHeader
          title="Audit logs"
          description="Sign-ins, invitations, QR changes, corrections and settings updates — recorded with time and IP address."
        />
        <AuditFeed />
      </div>
    </AppShell>
  );
}
