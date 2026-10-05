import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { dbConnect } from "@/lib/db/mongoose";
import { AttendanceLocation } from "@/models/AttendanceLocation";
import { getSession } from "@/lib/auth/session";
import { generateRawToken, hashToken } from "@/lib/auth/tokens";
import { writeAudit, auditContextFrom } from "@/lib/audit";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s || s.role !== "ORGANIZATION_ADMIN" || !s.orgId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "rotate"; // rotate | revoke
  await dbConnect();
  const loc = await AttendanceLocation.findOne({ _id: params.id, organizationId: s.orgId });
  if (!loc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "revoke") {
    loc.status = "REVOKED";
    await loc.save();
    await writeAudit({
      organizationId: s.orgId, actorId: s.sub, action: "QR_REVOKED",
      targetType: "AttendanceLocation", targetId: String(loc._id), ...auditContextFrom(req),
    });
    return NextResponse.json({ ok: true });
  }

  // rotate: new token, reactivate
  const raw = `chr_${generateRawToken(24)}`;
  loc.tokenHash = hashToken(raw);
  loc.status = "ACTIVE";
  await loc.save();
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
  const scanUrl = `${appUrl}/attendance/scan/${raw}`;
  const qrDataUrl = await QRCode.toDataURL(scanUrl, { margin: 1, width: 512 });
  await writeAudit({
    organizationId: s.orgId, actorId: s.sub, action: "QR_REGENERATED",
    targetType: "AttendanceLocation", targetId: String(loc._id), ...auditContextFrom(req),
  });
  return NextResponse.json({ ok: true, url: scanUrl, qrDataUrl });
}
