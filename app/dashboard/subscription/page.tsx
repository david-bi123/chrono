import { navForRole, orgWorkspaceContext } from "@/lib/dashboard-helpers";
import { AppShell } from "@/components/dashboard/shell";
import SubscriptionPage from "./sub-inner";

export default async function Page() {
  const ctx = await orgWorkspaceContext();
  return (
    <AppShell
      title="Subscription"
      subtitle="Plan, usage and billing"
      userName={ctx.userName}
      userEmail={ctx.userEmail}
      orgName={ctx.orgName}
      role={ctx.role}
      nav={navForRole(ctx.role)}
    >
      <SubscriptionPage canManage={ctx.isAdmin} />
    </AppShell>
  );
}
