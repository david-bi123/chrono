import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "./lib/auth/session";

const PUBLIC = ["/", "/login", "/forgot-password", "/reset-password", "/accept-invitation"];

function isPublic(path: string): boolean {
  if (PUBLIC.some((p) => path === p || path.startsWith(p + "/"))) return true;
  if (path.startsWith("/attendance/scan/")) return true; // page handles auth itself
  if (path.startsWith("/api/auth/")) return true;
  // QR scan flow must work while logged out: the page shows a sign-in prompt,
  // and both endpoints enforce their own auth (scan GET is session-optional,
  // clock POST returns JSON 401 when unauthenticated). A middleware redirect
  // here would turn into HTML that breaks fetch().json() callers.
  if (path.startsWith("/api/attendance/scan/")) return true;
  if (path === "/api/attendance/clock") return true;
  if (path === "/unauthorized") return true;
  return false;
}

// Exported for unit tests.
export { isPublic };

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }
  if (isPublic(pathname)) return NextResponse.next();
  const token = req.cookies.get("chrono_session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  // Role gates
  if (pathname.startsWith("/super-admin") && session.role !== "SUPER_ADMIN") {
    const url = req.nextUrl.clone();
    url.pathname = "/unauthorized";
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/dashboard") && !["ORGANIZATION_ADMIN", "SUPER_ADMIN"].includes(session.role)) {
    const url = req.nextUrl.clone();
    url.pathname = "/unauthorized";
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/staff") && !["STAFF", "ORGANIZATION_ADMIN", "SUPER_ADMIN"].includes(session.role)) {
    const url = req.nextUrl.clone();
    url.pathname = "/unauthorized";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
