import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/mongoose";
import { AttendanceLocation } from "@/models/AttendanceLocation";
import { Organization } from "@/models/Organization";
import { Attendance } from "@/models/Attendance";
import { getSession } from "@/lib/auth/session";
import { hashToken } from "@/lib/auth/tokens";
import { orgTodayKey, orgNowParts } from "@/lib/attendance/rules";

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const raw = params.token;
  await dbConnect();
  const loc = await AttendanceLocation.findOne({ tokenHash: hashToken(raw), status: "ACTIVE" }).lean();
  if (!loc) return NextResponse.json({ error: "QR invalid or revoked" }, { status: 404 });
  const org = await Organization.findById((loc as { organizationId: unknown }).organizationId).lean() as unknown as {
    _id: unknown; name: string; status: string; attendanceSettings?: { timezone?: string }; timezone?: string;
  } | null;
  if (!org || org.status !== "ACTIVE") return NextResponse.json({ error: "Organization unavailable" }, { status: 404 });

  const tz = org.attendanceSettings?.timezone || org.timezone || "Africa/Accra";
  const now = new Date();
  const s = await getSession();

  let mine: Record<string, unknown> | null = null;
  let belongs = false;
  if (s?.orgId && String(org._id) === String(s.orgId)) {
    belongs = true;
    const dateKey = orgTodayKey(now, tz);
    const rec = await Attendance.findOne({ organizationId: String(org._id), staffId: s.sub, date: dateKey }).lean();
    if (rec) {
      const r = rec as unknown as Record<string, unknown>;
      mine = { ...r, _id: String(r._id) };
    }
  }

  return NextResponse.json({
    orgName: org.name,
    locationName: (loc as { name: string }).name,
    now: now.toISOString(),
    display: orgNowParts(now, tz),
    timezone: tz,
    authenticated: Boolean(s),
    belongs,
    attendance: mine,
    role: s?.role || null,
  });
}
