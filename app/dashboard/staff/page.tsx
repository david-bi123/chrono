import { orgAdminContext, ORG_NAV } from "@/lib/dashboard-helpers";
import { AppShell } from "@/components/dashboard/shell";
import StaffPage from "./staff-inner";

export default async function Page() {
  const ctx = await orgAdminContext();
  return (
    <AppShell
      title="Staff"
      subtitle="Employees, invitations and access"
      userName={ctx.userName}
      orgName={ctx.orgName}
      role="ORGANIZATION_ADMIN"
      nav={ORG_NAV}
    >
      <StaffPage />
    </AppShell>
  );
}
