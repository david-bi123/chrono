import { orgAdminContext, ORG_NAV } from "@/lib/dashboard-helpers";
import { AppShell } from "@/components/dashboard/shell";
import AttendancePage from "./att-inner";

export default async function Page({ searchParams }: { searchParams?: { status?: string } }) {
  const ctx = await orgAdminContext();
  // Deep links from the dashboard (e.g. ?status=LATE) open the table pre-filtered.
  const allowed = ["PRESENT", "LATE", "EARLY_LEAVE", "HALF_DAY", "INCOMPLETE"];
  const requested = searchParams?.status;
  const initialStatus = requested && allowed.includes(requested) ? requested : undefined;
  return (
    <AppShell
      title="Attendance"
      subtitle="Track and manage your team's attendance"
      userName={ctx.userName}
      orgName={ctx.orgName}
      role="ORGANIZATION_ADMIN"
      nav={ORG_NAV}
    >
      <AttendancePage initialStatus={initialStatus} />
    </AppShell>
  );
}
