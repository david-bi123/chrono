import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/mongoose";
import { Organization } from "@/models/Organization";
import { getSession } from "@/lib/auth/session";
import { orgSettingsSchema, attendanceSettingsSchema } from "@/lib/validation/schemas";
import { writeAudit, auditContextFrom } from "@/lib/audit";
import { z } from "zod";

export async function GET() {
  const s = await getSession();
  if (!s || s.role !== "ORGANIZATION_ADMIN" || !s.orgId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await dbConnect();
  const org = await Organization.findById(s.orgId).lean();
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ org });
}

export async function PATCH(req: Request) {
  const s = await getSession();
  if (!s || s.role !== "ORGANIZATION_ADMIN" || !s.orgId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const parsed = z.object({
    org: orgSettingsSchema.partial().optional(),
    attendance: attendanceSettingsSchema.partial().optional(),
  }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  await dbConnect();
  const update: Record<string, unknown> = {};
  if (parsed.data.org) {
    const o = parsed.data.org;
    if (o.name !== undefined) update.name = o.name;
    if (o.email !== undefined) update.email = o.email;
    if (o.phone !== undefined) update.phone = o.phone;
    if (o.address !== undefined) update.address = o.address;
    if (o.industry !== undefined) update.industry = o.industry;
    if (o.timezone !== undefined) {
      update.timezone = o.timezone;
      update["attendanceSettings.timezone"] = o.timezone;
    }
  }
  if (parsed.data.attendance) {
    const a = parsed.data.attendance;
    if (a.workStart !== undefined) update["attendanceSettings.workStart"] = a.workStart;
    if (a.workEnd !== undefined) update["attendanceSettings.workEnd"] = a.workEnd;
    if (a.graceMinutes !== undefined) update["attendanceSettings.graceMinutes"] = a.graceMinutes;
    if (a.workingDays !== undefined) update["attendanceSettings.workingDays"] = a.workingDays;
    if (a.requireClockOut !== undefined) update["attendanceSettings.requireClockOut"] = a.requireClockOut;
    if (a.timezone !== undefined) {
      update["attendanceSettings.timezone"] = a.timezone;
      update.timezone = a.timezone;
    }
  }
  await Organization.findByIdAndUpdate(s.orgId, { $set: update });
  await writeAudit({
    organizationId: s.orgId, actorId: s.sub, action: "SETTINGS_CHANGED",
    targetType: "Organization", targetId: s.orgId, metadata: update, ...auditContextFrom(req),
  });
  return NextResponse.json({ ok: true });
}
