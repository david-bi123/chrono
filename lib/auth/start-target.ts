import type { SessionPayload } from "@/lib/auth/session";

/**
 * Launch destination for the installed app (manifest start_url `/start`).
 *
 * The three roles live in three different shells, so a fixed start_url would
 * dump staff on `/unauthorized`. With no session there is exactly one thing to
 * do — sign in — and `next=/start` sends the launch back through this resolver
 * afterwards, so the role routing still happens instead of guessing a shell.
 */
export function startPathFor(session: SessionPayload | null): string {
  if (!session) return "/login?next=%2Fstart";
  if (session.role === "SUPER_ADMIN") return "/super-admin";
  if (session.role === "STAFF") return "/staff";
  return "/dashboard";
}
