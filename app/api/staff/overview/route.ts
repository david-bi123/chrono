import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/mongoose";
import { Attendance } from "@/models/Attendance";
import { Organization } from "@/models/Organization";
import { getSession } from "@/lib/auth/session";
import { orgTodayKey } from "@/lib/attendance/rules";

export async function GET() {
  const s = await getSession();
  if (!s || s.role !== "STAFF" || !s.orgId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await dbConnect();
  const org = await Organization.findById(s.orgId).lean() as unknown as {
    name: string; attendanceSettings?: { timezone?: string };
  } | null;
  const tz = org?.attendanceSettings?.timezone || "Africa/Accra";
  const now = new Date();
  const todayKey = orgTodayKey(now, tz);
  const today = await Attendance.findOne({ organizationId: s.orgId, staffId: s.sub, date: todayKey }).lean();
  const recent = await Attendance.find({ organizationId: s.orgId, staffId: s.sub }).sort({ date: -1 }).limit(30).lean();
  const last30 = recent as unknown as Array<{ status: string; totalMinutes?: number }>;
  const present = last30.filter((r) => ["PRESENT", "LATE", "EARLY_LEAVE", "HALF_DAY"].includes(r.status)).length;
  const late = last30.filter((r) => r.status === "LATE").length;
  const totalMinutes = last30.reduce((a, r) => a + (r.totalMinutes || 0), 0);
  return NextResponse.json({
    orgName: org?.name || "",
    timezone: tz,
    today: today ? { ...(today as unknown as Record<string, unknown>), _id: String((today as unknown as { _id: unknown })._id) } : null,
    recent: (recent as unknown as Array<Record<string, unknown>>).map((r) => ({ ...r, _id: String(r._id) })),
    stats: {
      last30Days: last30.length,
      present,
      late,
      totalMinutes,
      attendancePct: last30.length ? Math.round((present / last30.length) * 100) : 0,
    },
  });
}
