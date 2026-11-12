import { navForRole, orgWorkspaceContext } from "@/lib/dashboard-helpers";
import { AppShell } from "@/components/dashboard/shell";
import QrPage from "./qr-inner";

export default async function Page() {
  const ctx = await orgWorkspaceContext();
  return (
    <AppShell
      title="Branches"
      subtitle="Attendance locations and printable QR codes"
      userName={ctx.userName}
      userEmail={ctx.userEmail}
      orgName={ctx.orgName}
      role={ctx.role}
      nav={navForRole(ctx.role)}
    >
      <QrPage orgName={ctx.orgName} canManage={ctx.isAdmin} />
    </AppShell>
  );
}
