import { ORG_NAV, orgAdminContext } from "@/lib/dashboard-helpers";
import { AppShell } from "@/components/dashboard/shell";
import ManagersPage from "./man-inner";

export default async function Page() {
  const ctx = await orgAdminContext();
  return (
    <AppShell
      title="Managers"
      subtitle="Read-only oversight for supervisors"
      userName={ctx.userName}
      userEmail={ctx.userEmail}
      orgName={ctx.orgName}
      role={ctx.role}
      nav={ORG_NAV}
    >
      <ManagersPage />
    </AppShell>
  );
}
