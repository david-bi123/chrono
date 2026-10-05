import { orgAdminContext, ORG_NAV } from "@/lib/dashboard-helpers";
import { AppShell } from "@/components/dashboard/shell";
import DashboardHome from "./home-inner";

export default async function Page() {
  const ctx = await orgAdminContext();
  return (
    <AppShell title="Overview" userName={ctx.userName} orgName={ctx.orgName} role="ORGANIZATION_ADMIN" nav={ORG_NAV}>
      <DashboardHome />
    </AppShell>
  );
}
