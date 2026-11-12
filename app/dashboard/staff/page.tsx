import { navForRole, orgWorkspaceContext } from "@/lib/dashboard-helpers";
import { AppShell } from "@/components/dashboard/shell";
import StaffPage from "./staff-inner";

export default async function Page() {
  const ctx = await orgWorkspaceContext();
  return (
    <AppShell
      title="Staff"
      subtitle="Employees, invitations and access"
      userName={ctx.userName}
      userEmail={ctx.userEmail}
      orgName={ctx.orgName}
      role={ctx.role}
      nav={navForRole(ctx.role)}
    >
      <StaffPage canManage={ctx.isAdmin} />
    </AppShell>
  );
}
