import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { getSession } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

const profileSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  phone: z.string().max(40).optional(),
});

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await dbConnect();
  const u = await User.findById(s.sub).lean();
  if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const o = u as unknown as Record<string, unknown>;
  return NextResponse.json({ profile: { ...o, _id: String(o._id), passwordHash: undefined } });
}

export async function PATCH(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));

  // password change branch
  if (body.currentPassword && body.newPassword) {
    const np = z.string().min(8).max(128).safeParse(body.newPassword);
    if (!np.success) return NextResponse.json({ error: "New password too weak" }, { status: 400 });
    await dbConnect();
    const u = await User.findById(s.sub).select("+passwordHash");
    if (!u || !u.passwordHash) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const ok = await verifyPassword(body.currentPassword, u.passwordHash);
    if (!ok) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    u.passwordHash = await hashPassword(body.newPassword);
    await u.save();
    return NextResponse.json({ ok: true });
  }

  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  await dbConnect();
  await User.findByIdAndUpdate(s.sub, parsed.data);
  return NextResponse.json({ ok: true });
}
