import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/mongoose";
import { Organization } from "@/models/Organization";
import { User } from "@/models/User";
import { Invitation } from "@/models/Invitation";
import { getSession } from "@/lib/auth/session";
import { generateRawToken, hashToken } from "@/lib/auth/tokens";
import { sendOrgAdminInvitation } from "@/lib/email/mailjet";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { writeAudit, auditContextFrom } from "@/lib/audit";

// Mint a fresh setup invitation for an organization's pending administrator.
// Used when the original email never arrived (or email delivery is broken):
// stale unused links are invalidated and the fresh link is returned when
// email can't be delivered, so it can be shared manually instead.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s || s.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rl = rateLimit(rateLimitKey(req, "resend-org-admin"), 20, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  await dbConnect();

  const org = await Organization.findById(params.id);
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const admin = await User.findOne({ organizationId: org._id, role: "ORGANIZATION_ADMIN" });
  if (!admin) return NextResponse.json({ error: "No administrator found for this organization" }, { status: 404 });
  if (admin.status === "ACTIVE" && admin.passwordHash) {
    return NextResponse.json({ error: "Administrator is already active" }, { status: 400 });
  }

  await Invitation.updateMany({ userId: admin._id, type: "ORG_ADMIN", usedAt: null }, { $set: { usedAt: new Date() } });
  const raw = generateRawToken();
  await Invitation.create({
    organizationId: org._id,
    email: admin.email,
    userId: admin._id,
    tokenHash: hashToken(raw),
    type: "ORG_ADMIN",
    expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
  });

  const appUrl = process.env.APP_URL || "";
  const setupLink = `${appUrl}/accept-invitation?token=${raw}`;
  let emailSent = false;
  try {
    const sent = await sendOrgAdminInvitation({
      to: admin.email,
      orgName: org.name,
      adminName: `${admin.firstName} ${admin.lastName}`,
      link: setupLink,
      expiresNote: "This link expires in 72 hours and can only be used once.",
    });
    emailSent = !sent.skipped;
  } catch (e) {
    console.error("org admin invitation resend email failed", e);
    emailSent = false;
  }

  await writeAudit({
    organizationId: String(org._id),
    actorId: s.sub,
    action: "ORGANIZATION_INVITATION_RESENT",
    targetType: "User",
    targetId: String(admin._id),
    metadata: { email: admin.email, emailSent },
    ...auditContextFrom(req),
  });

  return NextResponse.json({
    ok: true,
    email: admin.email,
    emailSent,
    setupLink: emailSent ? undefined : setupLink,
  });
}
