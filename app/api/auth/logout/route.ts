import { NextResponse } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  // Mirror the original cookie attributes exactly (Secure, SameSite, Path):
  // browsers match name + domain + path for deletion, and a Secure cookie
  // can be stubborn about removal when flags differ. Only maxAge changes.
  res.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  return res;
}
