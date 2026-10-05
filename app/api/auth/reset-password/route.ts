import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { Invitation } from "@/models/Invitation";
import { hashToken } from "@/lib/auth/tokens";
import { hashPassword } from "@/lib/auth/password";
import { passwordSchema } from "@/lib/validation/schemas";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { writeAudit, auditContextFrom } from "@/lib/audit";

const schema = z.object({ token: z.string().min(10), password: passwordSchema });

export async function POST(req: Request) {
  const rl = rateLimit(rateLimitKey(req, "reset"), 10, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  await dbConnect();
  const inv = await Invitation.findOne({
    tokenHash: hashToken(parsed.data.token),
    type: "PASSWORD_RESET",
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });
  if (!inv) return NextResponse.json({ error: "Link is invalid or expired" }, { status: 400 });
  const user = await User.findById(inv.userId).select("+passwordHash");
  if (!user) return NextResponse.json({ error: "Account not found" }, { status: 400 });
  user.passwordHash = await hashPassword(parsed.data.password);
  if (user.status === "PENDING") user.status = "ACTIVE";
  await user.save();
  inv.usedAt = new Date();
  await inv.save();
  await writeAudit({
    organizationId: user.organizationId ? String(user.organizationId) : null,
    actorId: String(user._id),
    action: "PASSWORD_RESET",
    targetId: String(user._id),
    ...auditContextFrom(req),
  });
  return NextResponse.json({ ok: true });
}
