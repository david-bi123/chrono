import { requireStaff } from "@/lib/auth/permissions";
import { dbConnect } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { AppShell } from "@/components/dashboard/shell";
import { STAFF_NAV } from "@/lib/dashboard-helpers";
import StaffHome from "./staff-inner";

export default async function Page() {
  const s = await requireStaff().catch(async () => {
    // org admins may also view; fall back to generic auth
    const { getSession } = await import("@/lib/auth/session");
    const sess = await getSession();
    if (!sess) throw new Error("unauthorized");
    return sess;
  });
  await dbConnect();
  const me = await User.findById(s.sub).lean() as unknown as { firstName: string; lastName: string } | null;
  return (
    <AppShell title="My Day" userName={me ? `${me.firstName} ${me.lastName}` : "Staff"} role={s.role} nav={STAFF_NAV}>
      <StaffHome />
    </AppShell>
  );
}
