import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth/session";

/**
 * Launch target for the installed app (manifest start_url).
 *
 * The three roles live in three different shells, so a fixed start_url would
 * dump staff on /unauthorized. This route resolves the cookie server-side and
 * bounces to the right home, or to /login when there is no session.
 */
export async function GET(req: Request) {
  const token = cookies().get("chrono_session")?.value;
  const session = token ? await verifySessionToken(token) : null;

  const destination = !session
    ? "/login"
    : session.role === "SUPER_ADMIN"
      ? "/super-admin"
      : session.role === "ORGANIZATION_ADMIN" || session.role === "MANAGER"
        ? "/dashboard"
        : "/staff";

  return NextResponse.redirect(new URL(destination, req.url));
}
