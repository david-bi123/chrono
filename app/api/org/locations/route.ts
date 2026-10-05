import { NextResponse } from "next/server";
import { z } from "zod";
import QRCode from "qrcode";
import { dbConnect } from "@/lib/db/mongoose";
import { AttendanceLocation } from "@/models/AttendanceLocation";
import { getSession } from "@/lib/auth/session";
import { generateRawToken, hashToken } from "@/lib/auth/tokens";
import { writeAudit, auditContextFrom } from "@/lib/audit";

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
}

export async function GET() {
  const s = await getSession();
  if (!s || s.role !== "ORGANIZATION_ADMIN" || !s.orgId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await dbConnect();
  // We cannot return raw tokens (only hashes stored). Return metadata; QR image
  // is fetched per-location via /qr endpoint which... can't recover raw token either.
  // Design decision: store a server-side "display token" encrypted? Simpler & secure:
  // on creation/rotation we return the raw token once; admin must download then.
  // For existing locations, admin can rotate to get a fresh printable QR.
  // To keep UX smooth we ALSO store the raw token's last-4 for identification (non-sensitive).
  const locs = await AttendanceLocation.find({ organizationId: s.orgId }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({
    locations: locs.map((l) => {
      const r = l as unknown as Record<string, unknown>;
      return { _id: String(r._id), name: r.name, status: r.status, createdAt: r.createdAt };
    }),
  });
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s || s.role !== "ORGANIZATION_ADMIN" || !s.orgId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const parsed = z.object({ name: z.string().trim().min(1).max(100) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  await dbConnect();
  const raw = `chr_${generateRawToken(24)}`;
  const loc = await AttendanceLocation.create({
    organizationId: s.orgId,
    name: parsed.data.name,
    tokenHash: hashToken(raw),
    status: "ACTIVE",
    createdBy: s.sub,
  });
  const url = `${appUrl()}/attendance/scan/${raw}`;
  const qrDataUrl = await QRCode.toDataURL(url, { margin: 1, width: 512 });
  await writeAudit({
    organizationId: s.orgId, actorId: s.sub, action: "QR_GENERATED",
    targetType: "AttendanceLocation", targetId: String(loc._id),
    metadata: { name: parsed.data.name }, ...auditContextFrom(req),
  });
  return NextResponse.json({ ok: true, id: String(loc._id), url, qrDataUrl }, { status: 201 });
}
