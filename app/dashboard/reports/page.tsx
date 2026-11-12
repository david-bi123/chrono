import { navForRole, orgWorkspaceContext } from "@/lib/dashboard-helpers";
import { AppShell } from "@/components/dashboard/shell";
import ReportsPage from "./rep-inner";

export default async function Page() {
  const ctx = await orgWorkspaceContext();
  return (
    <AppShell
      title="Reports"
      subtitle="Attendance analytics and exports"
      userName={ctx.userName}
      userEmail={ctx.userEmail}
      orgName={ctx.orgName}
      role={ctx.role}
      nav={navForRole(ctx.role)}
    >
      <ReportsPage />
    </AppShell>
  );
}
