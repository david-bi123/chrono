import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/mongoose";
import { AttendanceLocation } from "@/models/AttendanceLocation";
import { Organization } from "@/models/Organization";
import { Attendance } from "@/models/Attendance";
import { getSession } from "@/lib/auth/session";
import { hashToken } from "@/lib/auth/tokens";
import { orgTodayKey, orgNowParts } from "@/lib/attendance/rules";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { User } from "@/models/User";

export async function GET(req: Request, { params }: { params: { token: string } }) {
  // Public by design (logged-out scans see a sign-in prompt), so limit by IP.
  // Generous ceiling: whole offices often share one public IP at clock-in time.
  const rl = rateLimit(rateLimitKey(req, "scan"), 120, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts. Try again shortly." }, { status: 429 });
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

  // Shown on the "wrong organization" screen so the user can tell WHICH
  // account they're signed in with (stale sessions from another account are
  // the common cause) and switch without guessing.
  let sessionEmail: string | null = null;
  if (s) {
    const me = (await User.findById(s.sub).select("email").lean()) as unknown as {
      email?: string;
    } | null;
    sessionEmail = me?.email || null;
  }

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
    sessionEmail,
    belongs,
    attendance: mine,
    role: s?.role || null,
  });
}
