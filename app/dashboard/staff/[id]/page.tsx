import { navForRole, orgWorkspaceContext } from "@/lib/dashboard-helpers";
import { AppShell } from "@/components/dashboard/shell";
import { dbConnect } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import StaffProfile from "./profile-inner";

export default async function Page({ params }: { params: { id: string } }) {
  const ctx = await orgWorkspaceContext();
  await dbConnect();
  const person = (await User.findOne({
    _id: params.id,
    organizationId: ctx.session.orgId,
    role: "STAFF",
  }).lean()) as unknown as { firstName?: string; lastName?: string } | null;

  return (
    <AppShell
      title={person ? `${person.firstName} ${person.lastName}` : "Employee"}
      subtitle="Staff profile"
      userName={ctx.userName}
      userEmail={ctx.userEmail}
      orgName={ctx.orgName}
      role={ctx.role}
      nav={navForRole(ctx.role)}
    >
      <StaffProfile id={params.id} canManage={ctx.isAdmin} />
    </AppShell>
  );
}
