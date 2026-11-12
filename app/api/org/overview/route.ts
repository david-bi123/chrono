import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { Attendance } from "@/models/Attendance";
import { AttendanceLocation } from "@/models/AttendanceLocation";
import { Organization } from "@/models/Organization";
import { getSession } from "@/lib/auth/session";
import { orgTodayKey } from "@/lib/attendance/rules";

const DAY_MS = 24 * 60 * 60 * 1000;
const PRESENT_STATUSES = ["PRESENT", "LATE", "EARLY_LEAVE", "HALF_DAY"];

interface RangeRow {
  _id: string;
  present: number;
  late: number;
  early: number;
  total: number;
}

export async function GET() {
  const s = await getSession();
  // Managers get read-only org-wide oversight; writes stay admin-only.
  if (!s || !["ORGANIZATION_ADMIN", "MANAGER"].includes(s.role) || !s.orgId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await dbConnect();
  const org = await Organization.findById(s.orgId).lean() as unknown as {
    name: string; attendanceSettings?: { timezone?: string };
  } | null;
  const tz = org?.attendanceSettings?.timezone || "Africa/Accra";
  const now = new Date();
  const todayKey = orgTodayKey(now, tz);
  const weekFrom = orgTodayKey(new Date(now.getTime() - 6 * DAY_MS), tz);
  const monthFrom = orgTodayKey(new Date(now.getTime() - 29 * DAY_MS), tz);

  const [totalStaff, todayRows, weekRows, monthRows, locations] = await Promise.all([
    User.countDocuments({ organizationId: s.orgId, role: "STAFF", status: "ACTIVE" }),
    Attendance.find({ organizationId: s.orgId, date: todayKey })
      .populate("staffId", "firstName lastName employeeId department")
      .populate("locationId", "name")
      .sort({ createdAt: -1 })
      .lean(),
    Attendance.aggregate<RangeRow>([
      { $match: { organizationId: s.orgId, date: { $gte: weekFrom, $lte: todayKey } } },
      {
        $group: {
          _id: "$date",
          present: { $sum: { $cond: [{ $in: ["$status", PRESENT_STATUSES] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ["$status", "LATE"] }, 1, 0] } },
          early: { $sum: { $cond: [{ $eq: ["$status", "EARLY_LEAVE"] }, 1, 0] } },
          total: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Attendance.aggregate<RangeRow>([
      { $match: { organizationId: s.orgId, date: { $gte: monthFrom, $lte: todayKey } } },
      {
        $group: {
          _id: "$date",
          present: { $sum: { $cond: [{ $in: ["$status", PRESENT_STATUSES] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ["$status", "LATE"] }, 1, 0] } },
          early: { $sum: { $cond: [{ $eq: ["$status", "EARLY_LEAVE"] }, 1, 0] } },
          total: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    AttendanceLocation.find({ organizationId: s.orgId, status: "ACTIVE" }).select("name").lean(),
  ]);

  const rows = todayRows as unknown as Array<{
    status: string;
    clockOut?: unknown;
    locationId?: { _id?: unknown; name?: string } | null;
  }>;
  const present = rows.filter((r) => PRESENT_STATUSES.includes(r.status)).length;
  const late = rows.filter((r) => r.status === "LATE").length;
  const early = rows.filter((r) => r.status === "EARLY_LEAVE").length;
  const working = rows.filter((r) => r.clockOut == null && ["PRESENT", "LATE"].includes(r.status)).length;
  const completed = rows.filter((r) => r.clockOut != null).length;
  const absent = Math.max(0, totalStaff - present);

  // Fill missing days so charts show a continuous series instead of jumping.
  function series(aggregate: RangeRow[], days: number) {
    const byDate = new Map(aggregate.map((d) => [d._id, d]));
    const out: Array<{ date: string; present: number; late: number; early: number; absent: number }> = [];
    const start = now.getTime() - (days - 1) * DAY_MS;
    for (let i = 0; i < days; i++) {
      const key = orgTodayKey(new Date(start + i * DAY_MS), tz);
      const row = byDate.get(key);
      const p = row?.present ?? 0;
      out.push({
        date: key,
        present: p,
        late: row?.late ?? 0,
        early: row?.early ?? 0,
        absent: Math.max(0, totalStaff - p),
      });
    }
    return out;
  }

  const week = series(weekRows, 7);
  const month = series(monthRows, 30);

  const weeklyPresent = week.reduce((sum, d) => sum + d.present, 0);
  const weeklyRate = totalStaff > 0 ? Math.round((weeklyPresent / (totalStaff * 7)) * 100) : 0;
  const todayRate = totalStaff > 0 ? Math.round((present / totalStaff) * 100) : 0;

  // Branch performance today, based on where people actually clocked in.
  const branchMap = new Map<string, { name: string; present: number; late: number; absent: number }>();
  for (const loc of locations as unknown as Array<{ _id: unknown; name: string }>) {
    branchMap.set(String(loc._id), { name: loc.name, present: 0, late: 0, absent: 0 });
  }
  for (const r of rows) {
    const locId = r.locationId?._id ? String(r.locationId._id) : null;
    const key = locId || "unassigned";
    if (!branchMap.has(key)) {
      branchMap.set(key, { name: r.locationId?.name || "Unassigned", present: 0, late: 0, absent: 0 });
    }
    const entry = branchMap.get(key)!;
    if (PRESENT_STATUSES.includes(r.status)) entry.present += 1;
    if (r.status === "LATE") entry.late += 1;
  }
  const branches = Array.from(branchMap.entries())
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.present - a.present);

  return NextResponse.json({
    orgName: org?.name || "",
    timezone: tz,
    date: todayKey,
    overview: {
      totalStaff,
      present,
      late,
      absent,
      working,
      completed,
      early,
      todayRate,
      weeklyRate,
    },
    trend: { week, month },
    branches,
    statusBreakdown: [
      { status: "PRESENT", count: rows.filter((r) => r.status === "PRESENT").length },
      { status: "LATE", count: late },
      { status: "EARLY_LEAVE", count: early },
      { status: "HALF_DAY", count: rows.filter((r) => r.status === "HALF_DAY").length },
      { status: "INCOMPLETE", count: rows.filter((r) => r.status === "INCOMPLETE").length },
      { status: "ABSENT", count: absent },
    ],
    activity: (todayRows as unknown as Array<Record<string, unknown>>).map((r) => ({ ...r, _id: String(r._id) })),
  });
}
