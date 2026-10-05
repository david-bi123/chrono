import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { Organization } from "@/models/Organization";
import { Invitation } from "@/models/Invitation";
import { hashToken } from "@/lib/auth/tokens";
import { hashPassword } from "@/lib/auth/password";
import { setupAccountSchema } from "@/lib/validation/schemas";
import { sendWelcome } from "@/lib/email/mailjet";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { writeAudit, auditContextFrom } from "@/lib/audit";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });
  await dbConnect();
  const inv = await Invitation.findOne({
    tokenHash: hashToken(token),
    usedAt: null,
    expiresAt: { $gt: new Date() },
    type: { $in: ["ORG_ADMIN", "STAFF"] },
  }).lean();
  if (!inv) return NextResponse.json({ error: "Invitation is invalid or expired" }, { status: 400 });
  const org = inv.organizationId ? await Organization.findById(inv.organizationId).select("name").lean() : null;
  return NextResponse.json({
    email: (inv as { email: string }).email,
    type: (inv as { type: string }).type,
    orgName: (org as { name?: string } | null)?.name || "Chrono",
  });
}

export async function POST(req: Request) {
  const rl = rateLimit(rateLimitKey(req, "accept"), 10, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  const parsed = setupAccountSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  await dbConnect();
  const inv = await Invitation.findOne({
    tokenHash: hashToken(parsed.data.token),
    usedAt: null,
    expiresAt: { $gt: new Date() },
    type: { $in: ["ORG_ADMIN", "STAFF"] },
  });
  if (!inv) return NextResponse.json({ error: "Invitation is invalid or expired" }, { status: 400 });
  const user = await User.findById(inv.userId);
  if (!user) return NextResponse.json({ error: "Account not found" }, { status: 400 });
  if (user.status !== "PENDING" && !user.passwordHash) {
    // allow setting password for pending only
  }
  user.passwordHash = await hashPassword(parsed.data.password);
  if (parsed.data.firstName) user.firstName = parsed.data.firstName;
  if (parsed.data.lastName) user.lastName = parsed.data.lastName;
  if (parsed.data.phone !== undefined) user.phone = parsed.data.phone;
  user.status = "ACTIVE";
  await user.save();
  inv.usedAt = new Date();
  await inv.save();
  const org = inv.organizationId ? await Organization.findById(inv.organizationId).lean() : null;
  const orgName = (org as { name?: string } | null)?.name || "Chrono";
  await sendWelcome({ to: user.email, name: user.firstName, orgName }).catch(() => {});
  await writeAudit({
    organizationId: inv.organizationId ? String(inv.organizationId) : null,
    actorId: String(user._id),
    action: "INVITATION_ACCEPTED",
    targetId: String(user._id),
    metadata: { type: inv.type },
    ...auditContextFrom(req),
  });
  return NextResponse.json({ ok: true, role: user.role });
}
