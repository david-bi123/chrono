import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth/session";
import { startPathFor } from "@/lib/auth/start-target";

/**
 * Launch target for the installed app (manifest start_url).
 *
 * Resolves the cookie server-side and bounces to the right home. Signed-out
 * launches go to /login with next=/start, so the single sign-in still ends on
 * the launcher (which knows the role) rather than a hard-coded dashboard.
 */
export async function GET(req: Request) {
  const token = cookies().get("chrono_session")?.value;
  const session = token ? await verifySessionToken(token) : null;

  return NextResponse.redirect(new URL(startPathFor(session), req.url));
}
