/**
 * Allowlist for post-login redirects. Only same-origin app paths are
 * permitted — absolute URLs, protocol-relative URLs and schemes are
 * rejected (open-redirect protection).
 */
export function safeNextPath(raw: string | null | undefined): string {
  if (!raw) return "";
  const v = raw.trim();
  if (!v.startsWith("/")) return "";
  if (v.startsWith("//")) return "";
  if (v.includes("\\")) return "";
  if (/^\/[a-zA-Z][a-zA-Z0-9+.-]*:/.test(v)) return ""; // e.g. /javascript:… or /https:…
  return v;
}
