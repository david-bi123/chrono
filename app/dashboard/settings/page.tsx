import { orgAdminContext, ORG_NAV } from "@/lib/dashboard-helpers";
import { AppShell } from "@/components/dashboard/shell";
import SettingsPage from "./set-inner";

export default async function Page() {
  const ctx = await orgAdminContext();
  return (
    <AppShell
      title="Settings"
      subtitle="Organization preferences and attendance rules"
      userName={ctx.userName}
      orgName={ctx.orgName}
      role="ORGANIZATION_ADMIN"
      nav={ORG_NAV}
    >
      <SettingsPage />
    </AppShell>
  );
}
