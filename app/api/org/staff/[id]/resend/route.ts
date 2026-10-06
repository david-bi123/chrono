import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { Invitation } from "@/models/Invitation";
import { Organization } from "@/models/Organization";
import { getSession } from "@/lib/auth/session";
import { generateRawToken, hashToken } from "@/lib/auth/tokens";
import { sendStaffInvitation } from "@/lib/email/mailjet";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { writeAudit, auditContextFrom } from "@/lib/audit";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s || s.role !== "ORGANIZATION_ADMIN" || !s.orgId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rl = rateLimit(rateLimitKey(req, `resend:${s.orgId}`), 20, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  await dbConnect();
  const staff = await User.findOne({ _id: params.id, organizationId: s.orgId, role: "STAFF" });
  if (!staff) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (staff.status === "DISABLED") return NextResponse.json({ error: "Staff is disabled" }, { status: 400 });
  // invalidate old pending invitations
  await Invitation.updateMany({ userId: staff._id, usedAt: null }, { $set: { usedAt: new Date() } });
  const raw = generateRawToken();
  await Invitation.create({
    organizationId: s.orgId,
    email: staff.email,
    userId: staff._id,
    tokenHash: hashToken(raw),
    type: "STAFF",
    expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
  });
  const org = await Organization.findById(s.orgId);
  const appUrl = process.env.APP_URL || "";
  const setupLink = `${appUrl}/accept-invitation?token=${raw}`;
  // Email delivery must never fail the request with a rotated-but-unshared
  // link: hand the fresh link back so it can be shared manually instead.
  let emailSent = false;
  try {
    const sent = await sendStaffInvitation({
      to: staff.email,
      orgName: org?.name || "ChronoSwift",
      staffName: `${staff.firstName} ${staff.lastName}`,
      link: setupLink,
      expiresNote: "This invitation expires in 72 hours and can only be used once.",
    });
    emailSent = !sent.skipped;
  } catch (e) {
    console.error("staff invitation resend email failed", e);
    emailSent = false;
  }
  await writeAudit({
    organizationId: s.orgId, actorId: s.sub, action: "STAFF_INVITATION_RESENT",
    targetType: "User", targetId: String(staff._id), metadata: { emailSent }, ...auditContextFrom(req),
  });
  return NextResponse.json({ ok: true, emailSent, setupLink: emailSent ? undefined : setupLink });
}
