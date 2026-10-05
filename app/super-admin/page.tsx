import { requireSuperAdmin } from "@/lib/auth/permissions";
import { dbConnect } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { AppShell } from "@/components/dashboard/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default async function SuperAdminHome() {
  const s = await requireSuperAdmin();
  await dbConnect();
  const me = await User.findById(s.sub).lean() as unknown as { firstName: string; lastName: string } | null;

  return (
    <AppShell
      title="Platform overview"
      userName={me ? `${me.firstName} ${me.lastName}` : "Super Admin"}
      role="SUPER_ADMIN"
      nav={[
        { href: "/super-admin", label: "Overview" },
        { href: "/super-admin/organizations", label: "Organizations" },
        { href: "/super-admin/audit", label: "Activity" },
      ]}
    >
      <StatsCards />
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Quick actions</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <Link href="/super-admin/organizations/new" className="rounded-lg bg-neutral-900 px-4 py-2 text-center text-white">Create organization</Link>
            <Link href="/super-admin/organizations" className="rounded-lg border px-4 py-2 text-center">View organizations</Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>How tenant provisioning works</CardTitle></CardHeader>
          <CardContent className="text-[13px] leading-relaxed text-neutral-500">
            Creating an organization also creates its admin (PENDING) and a single-use 72h setup link emailed via Mailjet.
            Only the hash is stored. The admin sets their own password — never emailed.
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

async function StatsCards() {
  const { headers } = await import("next/headers");
  // Fetch via direct DB to avoid self-fetch in server component
  const { dbConnect: c } = await import("@/lib/db/mongoose");
  await c();
  const { Organization: O } = await import("@/models/Organization");
  const { User: U } = await import("@/models/User");
  const [orgs, staff, admins] = await Promise.all([
    O.countDocuments(),
    U.countDocuments({ role: "STAFF", status: "ACTIVE" }),
    U.countDocuments({ role: "ORGANIZATION_ADMIN" }),
  ]);
  const cards = [
    ["Organizations", String(orgs)],
    ["Active staff", String(staff)],
    ["Org admins", String(admins)],
  ];
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map(([k, v]) => (
        <Card key={k}><CardContent className="p-5"><div className="text-2xl font-bold">{v}</div><div className="mt-1 text-[13px] text-neutral-500">{k}</div></CardContent></Card>
      ))}
    </div>
  );
}
