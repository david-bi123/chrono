import { navForRole, orgWorkspaceContext } from "@/lib/dashboard-helpers";
import { AppShell } from "@/components/dashboard/shell";
import DashboardHome from "./home-inner";

export default async function Page() {
  const ctx = await orgWorkspaceContext();
  return (
    <AppShell
      title="Overview"
      userName={ctx.userName}
      userEmail={ctx.userEmail}
      orgName={ctx.orgName}
      role={ctx.role}
      nav={navForRole(ctx.role)}
    >
      <DashboardHome />
    </AppShell>
  );
}
