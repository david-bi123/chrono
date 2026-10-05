import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { Organization } from "@/models/Organization";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth/session";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { writeAudit, auditContextFrom } from "@/lib/audit";

const bodySchema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: Request) {
  const rl = rateLimit(rateLimitKey(req, "login"), 10, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts. Try again shortly." }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });

  await dbConnect();
  const email = parsed.data.email.toLowerCase().trim();
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
  if (user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Account is not active. Check your invitation email." }, { status: 403 });
  }
  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  if (user.organizationId) {
    const org = await Organization.findById(user.organizationId).select("status");
    if (!org || org.status !== "ACTIVE") {
      return NextResponse.json({ error: "Organization is suspended. Contact support." }, { status: 403 });
    }
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = await createSession({
    sub: String(user._id),
    orgId: user.organizationId ? String(user.organizationId) : null,
    role: user.role,
  });

  await writeAudit({
    organizationId: user.organizationId ? String(user.organizationId) : null,
    actorId: String(user._id),
    action: "LOGIN",
    ...auditContextFrom(req),
  });

  const res = NextResponse.json({
    ok: true,
    role: user.role,
    redirectTo:
      user.role === "SUPER_ADMIN" ? "/super-admin" : user.role === "ORGANIZATION_ADMIN" ? "/dashboard" : "/staff",
  });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
