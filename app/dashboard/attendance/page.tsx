import { navForRole, orgWorkspaceContext } from "@/lib/dashboard-helpers";
import { AppShell } from "@/components/dashboard/shell";
import AttendancePage from "./att-inner";

export default async function Page({ searchParams }: { searchParams?: { status?: string } }) {
  const ctx = await orgWorkspaceContext();
  // Deep links from the dashboard (e.g. ?status=LATE) open the table pre-filtered.
  const allowed = ["PRESENT", "LATE", "EARLY_LEAVE", "HALF_DAY", "INCOMPLETE"];
  const requested = searchParams?.status;
  const initialStatus = requested && allowed.includes(requested) ? requested : undefined;
  return (
    <AppShell
      title="Attendance"
      subtitle="Track and manage your team's attendance"
      userName={ctx.userName}
      userEmail={ctx.userEmail}
      orgName={ctx.orgName}
      role={ctx.role}
      nav={navForRole(ctx.role)}
    >
      <AttendancePage initialStatus={initialStatus} canManage={ctx.isAdmin} />
    </AppShell>
  );
}
