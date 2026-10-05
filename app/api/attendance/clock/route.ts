import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db/mongoose";
import { Attendance } from "@/models/Attendance";
import { AttendanceLocation } from "@/models/AttendanceLocation";
import { Organization } from "@/models/Organization";
import { User } from "@/models/User";
import { getSession } from "@/lib/auth/session";
import { hashToken } from "@/lib/auth/tokens";
import { orgTodayKey, decideClockInStatus, decideClockOutStatus } from "@/lib/attendance/rules";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { writeAudit, auditContextFrom } from "@/lib/audit";

const schema = z.object({ locationToken: z.string().min(8) });

async function resolveLocation(rawToken: string) {
  await dbConnect();
  const loc = await AttendanceLocation.findOne({ tokenHash: hashToken(rawToken), status: "ACTIVE" });
  if (!loc) return null;
  const org = await Organization.findById(loc.organizationId);
  if (!org || org.status !== "ACTIVE") return null;
  return { loc, org };
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") || "in"; // in | out
  const s = await getSession();
  if (!s || !s.orgId || !["STAFF", "ORGANIZATION_ADMIN"].includes(s.role)) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const rl = rateLimit(rateLimitKey(req, `clock:${s.sub}`), 20, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid QR" }, { status: 400 });

  const resolved = await resolveLocation(parsed.data.locationToken);
  if (!resolved) return NextResponse.json({ error: "QR code is invalid or revoked" }, { status: 400 });

  // Tenant check: staff must belong to the QR's organization.
  if (String(resolved.org._id) !== String(s.orgId)) {
    return NextResponse.json({ error: "This QR belongs to a different organization" }, { status: 403 });
  }

  const staff = await User.findOne({ _id: s.sub, organizationId: s.orgId });
  if (!staff || staff.status !== "ACTIVE") return NextResponse.json({ error: "Account is not active" }, { status: 403 });

  const tz = resolved.org.attendanceSettings?.timezone || resolved.org.timezone || "Africa/Accra";
  const now = new Date(); // SERVER time — never trust client timestamps
  const dateKey = orgTodayKey(now, tz);
  const rules = {
    workStart: resolved.org.attendanceSettings?.workStart || "08:00",
    workEnd: resolved.org.attendanceSettings?.workEnd || "17:00",
    graceMinutes: resolved.org.attendanceSettings?.graceMinutes ?? 15,
  };

  const existing = await Attendance.findOne({ organizationId: s.orgId, staffId: s.sub, date: dateKey });

  if (mode === "in") {
    if (existing?.clockIn) return NextResponse.json({ error: "You're already clocked in", attendance: serialize(existing) }, { status: 409 });
    const status = decideClockInStatus(now, tz, rules);
    const rec = existing
      ? Object.assign(existing, { clockIn: now, timezone: tz, locationId: resolved.loc._id, status, source: "QR" })
      : new Attendance({
          organizationId: s.orgId,
          staffId: s.sub,
          locationId: resolved.loc._id,
          date: dateKey,
          clockIn: now,
          timezone: tz,
          status,
          source: "QR",
        });
    await rec.save();
    await writeAudit({
      organizationId: String(s.orgId), actorId: s.sub, action: "CLOCK_IN",
      targetType: "Attendance", targetId: String(rec._id),
      metadata: { location: resolved.loc.name }, ...auditContextFrom(req),
    });
    return NextResponse.json({ ok: true, attendance: serialize(rec) });
  }

  // clock out
  if (!existing?.clockIn) return NextResponse.json({ error: "Clock in first" }, { status: 400 });
  if (existing.clockOut) return NextResponse.json({ error: "Already clocked out", attendance: serialize(existing) }, { status: 409 });
  const { status, totalMinutes } = decideClockOutStatus(existing.clockIn, now, tz, rules);
  existing.clockOut = now;
  existing.status = status;
  existing.totalMinutes = totalMinutes;
  await existing.save();
  await writeAudit({
    organizationId: String(s.orgId), actorId: s.sub, action: "CLOCK_OUT",
    targetType: "Attendance", targetId: String(existing._id),
    metadata: { totalMinutes }, ...auditContextFrom(req),
  });
  return NextResponse.json({ ok: true, attendance: serialize(existing) });
}

function serialize(a: Record<string, unknown> | { toObject(): Record<string, unknown> }) {
  const o = typeof (a as { toObject?: unknown }).toObject === "function" ? (a as { toObject(): Record<string, unknown> }).toObject() : (a as Record<string, unknown>);
  return { ...o, _id: String(o._id) };
}
