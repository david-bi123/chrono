import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { Invitation } from "@/models/Invitation";
import { generateRawToken, hashToken } from "@/lib/auth/tokens";
import { sendPasswordReset } from "@/lib/email/mailjet";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const rl = rateLimit(rateLimitKey(req, "forgot"), 5, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ ok: true }); // silently throttle
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: true });
  await dbConnect();
  const email = parsed.data.email.toLowerCase().trim();
  const user = await User.findOne({ email });
  if (!user || user.status !== "ACTIVE") return NextResponse.json({ ok: true });
  const raw = generateRawToken();
  await Invitation.create({
    organizationId: user.organizationId ?? null,
    email,
    userId: user._id,
    tokenHash: hashToken(raw),
    type: "PASSWORD_RESET",
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });
  const appUrl = process.env.APP_URL || "";
  await sendPasswordReset({
    to: email,
    name: `${user.firstName}`,
    link: `${appUrl}/reset-password?token=${raw}`,
  });
  return NextResponse.json({ ok: true });
}
