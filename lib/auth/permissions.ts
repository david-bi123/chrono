import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "./session";

export async function requireAuth(): Promise<SessionPayload> {
  const s = await getSession();
  if (!s) redirect("/login?next=" + encodeURIComponent("/"));
  return s;
}

export async function requireRole(...roles: SessionPayload["role"][]): Promise<SessionPayload> {
  const s = await requireAuth();
  if (!roles.includes(s.role)) redirect("/unauthorized");
  return s;
}

export async function requireSuperAdmin(): Promise<SessionPayload> {
  return requireRole("SUPER_ADMIN");
}

export async function requireOrgAdmin(): Promise<SessionPayload> {
  const s = await requireRole("ORGANIZATION_ADMIN");
  if (!s.orgId) redirect("/unauthorized");
  return s;
}

export async function requireStaff(): Promise<SessionPayload> {
  const s = await requireRole("STAFF");
  if (!s.orgId) redirect("/unauthorized");
  return s;
}

/** Assert that the session may access the given organization. Super admin may access any org explicitly. */
export function assertOrgAccess(session: SessionPayload, organizationId: string) {
  if (session.role === "SUPER_ADMIN") return;
  if (!session.orgId || session.orgId !== String(organizationId)) {
    throw new AuthorizationError("You do not have access to this organization");
  }
}

export class AuthorizationError extends Error {
  status = 403;
  constructor(message = "Forbidden") {
    super(message);
    this.name = "AuthorizationError";
  }
}
