import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { dbConnect } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { AppShell } from "@/components/dashboard/shell";
import { STAFF_NAV } from "@/lib/dashboard-helpers";
import ClockPage from "./clock-inner";

export default async function Page() {
  const s = await getSession();
  if (!s) redirect("/login");
  await dbConnect();
  const me = await User.findById(s.sub).lean() as unknown as { firstName: string; lastName: string } | null;
  return (
    <AppShell title="Clock In" userName={me ? `${me.firstName} ${me.lastName}` : "Staff"} role={s.role} nav={STAFF_NAV}>
      <ClockPage />
    </AppShell>
  );
}
