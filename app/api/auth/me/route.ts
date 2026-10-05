import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { dbConnect } from "@/lib/db/mongoose";
import { User } from "@/models/User";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ user: null }, { status: 401 });
  await dbConnect();
  const user = await User.findById(s.sub).lean();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({
    user: {
      id: String((user as { _id: unknown })._id),
      email: (user as { email: string }).email,
      firstName: (user as { firstName: string }).firstName,
      lastName: (user as { lastName: string }).lastName,
      role: (user as { role: string }).role,
      organizationId: (user as { organizationId: unknown }) ? String((user as { organizationId: unknown }).organizationId) : null,
    },
    session: s,
  });
}
