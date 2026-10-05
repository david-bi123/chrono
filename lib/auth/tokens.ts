import crypto from "crypto";

/** Generate a cryptographically random token (raw, sent to user). */
export function generateRawToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/** SHA-256 hash for storing tokens (invitations, QR, password reset). */
export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  const suffix = crypto.randomBytes(3).toString("hex");
  return `${base || "org"}-${suffix}`;
}
