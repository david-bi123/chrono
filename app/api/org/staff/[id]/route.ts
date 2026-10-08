import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { Attendance } from "@/models/Attendance";
import { Organization } from "@/models/Organization";
// Required for .populate("locationId"): route bundles only include imported
// modules, and populate looks the ref'd model up on the connection. Without
// this import the endpoint 500s with MissingSchemaError whenever the staff
// member actually has attendance records.
import "@/models/AttendanceLocation";
import { getSession } from "@/lib/auth/session";
import { orgTodayKey } from "@/lib/attendance/rules";
import { writeAudit, auditContextFrom } from "@/lib/audit";

const schema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  department: z.string().max(80).optional(),
  position: z.string().max(80).optional(),
  phone: z.string().max(40).optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
});

/** Read-only detail + attendance history for the admin staff profile screen. */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s || s.role !== "ORGANIZATION_ADMIN" || !s.orgId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!/^[a-fA-F0-9]{24}$/.test(params.id))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await dbConnect();
    const staff = await User.findOne({ _id: params.id, organizationId: s.orgId, role: "STAFF" }).lean();
    if (!staff) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const url = new URL(req.url);
    const days = Math.min(120, Math.max(1, Number(url.searchParams.get("days") || 30)));

    const org = (await Organization.findById(s.orgId).lean()) as unknown as {
      attendanceSettings?: { timezone?: string };
    } | null;
    const tz = org?.attendanceSettings?.timezone || "Africa/Accra";
    const to = orgTodayKey(new Date(), tz);
    const from = orgTodayKey(new Date(Date.now() - (days - 1) * 86400000), tz);

    const rows = await Attendance.find({
      organizationId: s.orgId,
      staffId: params.id,
      date: { $gte: from, $lte: to },
    })
      .sort({ date: -1 })
      .limit(days)
      .populate("locationId", "name")
      .lean();

    const records = rows as unknown as Array<{ status: string; totalMinutes?: number }>;
    const present = records.filter((r) =>
      ["PRESENT", "LATE", "EARLY_LEAVE", "HALF_DAY"].includes(r.status)
    ).length;
    const late = records.filter((r) => r.status === "LATE").length;
    const totalMinutes = records.reduce((a, r) => a + (r.totalMinutes || 0), 0);

    const staffJson = staff as unknown as Record<string, unknown>;

    return NextResponse.json({
      staff: { ...staffJson, _id: String(staffJson._id), passwordHash: undefined },
      range: { from, to, days },
      attendance: rows.map((r) => {
        const o = r as unknown as Record<string, unknown>;
        return { ...o, _id: String(o._id) };
      }),
      summary: {
        records: records.length,
        present,
        late,
        totalMinutes,
        attendancePct: records.length ? Math.round((present / records.length) * 100) : 0,
      },
    });
  } catch (e) {
    console.error("staff detail GET failed", e);
    return NextResponse.json({ error: "Couldn't load this profile. Please try again." }, { status: 500 });
  }
}

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
