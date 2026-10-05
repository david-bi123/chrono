import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db/mongoose";
import { Organization } from "@/models/Organization";
import { getSession } from "@/lib/auth/session";
import { writeAudit, auditContextFrom } from "@/lib/audit";

const patchSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(40).optional(),
  address: z.string().max(300).optional(),
  industry: z.string().max(100).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s || s.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  await dbConnect();
  const org = await Organization.findByIdAndUpdate(params.id, parsed.data, { new: true }).lean();
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await writeAudit({
    organizationId: params.id,
    actorId: s.sub,
    action: "ORGANIZATION_UPDATED",
    targetType: "Organization",
    targetId: params.id,
    metadata: parsed.data,
    ...auditContextFrom(req),
  });
  return NextResponse.json({ ok: true });
}
