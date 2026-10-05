import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/mongoose";
import { Attendance } from "@/models/Attendance";
import { getSession } from "@/lib/auth/session";
import { correctionSchema } from "@/lib/validation/schemas";
import { writeAudit, auditContextFrom } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s || s.role !== "ORGANIZATION_ADMIN" || !s.orgId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const parsed = correctionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  await dbConnect();
  const rec = await Attendance.findOne({ _id: params.id, organizationId: s.orgId });
  if (!rec) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const before = { clockIn: rec.clockIn, clockOut: rec.clockOut, status: rec.status };
  rec.clockIn = new Date(parsed.data.clockIn);
  rec.clockOut = parsed.data.clockOut ? new Date(parsed.data.clockOut) : null;
  if (rec.clockIn && rec.clockOut) {
    rec.totalMinutes = Math.max(0, Math.round((rec.clockOut.getTime() - rec.clockIn.getTime()) / 60000));
  }
  rec.source = "MANUAL";
  rec.correctionReason = parsed.data.reason;
  rec.correctedBy = s.sub as unknown as typeof rec.correctedBy;
  await rec.save();
  await writeAudit({
    organizationId: s.orgId, actorId: s.sub, action: "ATTENDANCE_CORRECTED",
    targetType: "Attendance", targetId: String(rec._id),
    metadata: { before: JSON.parse(JSON.stringify(before)), reason: parsed.data.reason },
    ...auditContextFrom(req),
  });
  return NextResponse.json({ ok: true });
}
