import { orgAdminContext, ORG_NAV } from "@/lib/dashboard-helpers";
import { AppShell } from "@/components/dashboard/shell";
import ReportsPage from "./rep-inner";

export default async function Page() {
  const ctx = await orgAdminContext();
  return (
    <AppShell title="Reports" userName={ctx.userName} orgName={ctx.orgName} role="ORGANIZATION_ADMIN" nav={ORG_NAV}>
      <ReportsPage />
    </AppShell>
  );
}
