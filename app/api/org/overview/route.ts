import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { Attendance } from "@/models/Attendance";
import { Organization } from "@/models/Organization";
import { getSession } from "@/lib/auth/session";
import { orgTodayKey } from "@/lib/attendance/rules";

export async function GET() {
  const s = await getSession();
  if (!s || s.role !== "ORGANIZATION_ADMIN" || !s.orgId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await dbConnect();
  const org = await Organization.findById(s.orgId).lean() as unknown as {
    name: string; attendanceSettings?: { timezone?: string };
  } | null;
  const tz = org?.attendanceSettings?.timezone || "Africa/Accra";
  const todayKey = orgTodayKey(new Date(), tz);
  const [totalStaff, todayRows] = await Promise.all([
    User.countDocuments({ organizationId: s.orgId, role: "STAFF", status: "ACTIVE" }),
    Attendance.find({ organizationId: s.orgId, date: todayKey })
      .populate("staffId", "firstName lastName employeeId department")
      .sort({ createdAt: -1 })
      .lean(),
  ]);
  const rows = todayRows as unknown as Array<{ status: string; clockOut?: unknown }>;
  const present = rows.filter((r) => ["PRESENT", "LATE", "EARLY_LEAVE", "HALF_DAY"].includes(r.status)).length;
  const late = rows.filter((r) => r.status === "LATE").length;
  const working = rows.filter((r) => r.clockOut == null && ["PRESENT", "LATE"].includes(r.status)).length;
  const completed = rows.filter((r) => r.clockOut != null).length;
  const absent = Math.max(0, totalStaff - present);
  return NextResponse.json({
    orgName: org?.name || "",
    timezone: tz,
    date: todayKey,
    overview: { totalStaff, present, late, absent, working, completed },
    activity: (todayRows as unknown as Array<Record<string, unknown>>).map((r) => ({ ...r, _id: String(r._id) })),
  });
}
