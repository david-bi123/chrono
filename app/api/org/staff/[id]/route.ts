import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { getSession } from "@/lib/auth/session";
import { writeAudit, auditContextFrom } from "@/lib/audit";

const schema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  department: z.string().max(80).optional(),
  position: z.string().max(80).optional(),
  phone: z.string().max(40).optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s || s.role !== "ORGANIZATION_ADMIN" || !s.orgId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  await dbConnect();
  const staff = await User.findOne({ _id: params.id, organizationId: s.orgId, role: "STAFF" });
  if (!staff) return NextResponse.json({ error: "Not found" }, { status: 404 });
  Object.assign(staff, parsed.data);
  await staff.save();
  await writeAudit({
    organizationId: s.orgId,
    actorId: s.sub,
    action: parsed.data.status === "DISABLED" ? "STAFF_DISABLED" : parsed.data.status === "ACTIVE" ? "STAFF_REACTIVATED" : "STAFF_UPDATED",
    targetType: "User",
    targetId: String(staff._id),
    metadata: parsed.data,
    ...auditContextFrom(req),
  });
  return NextResponse.json({ ok: true });
}
