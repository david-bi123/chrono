import { orgAdminContext, ORG_NAV } from "@/lib/dashboard-helpers";
import { AppShell } from "@/components/dashboard/shell";
import AuditPage from "./audit-inner";

export default async function Page() {
  const ctx = await orgAdminContext();
  return (
    <AppShell title="Audit Logs" userName={ctx.userName} orgName={ctx.orgName} role="ORGANIZATION_ADMIN" nav={ORG_NAV}>
      <AuditPage />
    </AppShell>
  );
}
