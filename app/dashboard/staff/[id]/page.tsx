import { orgAdminContext, ORG_NAV } from "@/lib/dashboard-helpers";
import { AppShell } from "@/components/dashboard/shell";
import { dbConnect } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import StaffProfile from "./profile-inner";

export default async function Page({ params }: { params: { id: string } }) {
  const ctx = await orgAdminContext();
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
      orgName={ctx.orgName}
      role="ORGANIZATION_ADMIN"
      nav={ORG_NAV}
    >
      <StaffProfile id={params.id} />
    </AppShell>
  );
}
