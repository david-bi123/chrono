// Simple in-memory token-bucket rate limiter.
// NOTE: on serverless (Vercel) each instance has its own bucket — good enough
// as a first line of defence. For distributed limiting use Upstash Redis.
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAfterMs: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetAfterMs: windowMs };
  }
  if (b.count >= limit) {
    return { ok: false, remaining: 0, resetAfterMs: b.resetAt - now };
  }
  b.count += 1;
  return { ok: true, remaining: limit - b.count, resetAfterMs: b.resetAt - now };
}

export function rateLimitKey(req: Request, scope: string): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return `${scope}:${ip}`;
}

// Periodic cleanup to avoid unbounded growth.
if (typeof setInterval !== "undefined") {
  const t = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of buckets) if (now >= v.resetAt) buckets.delete(k);
  }, 60_000);
  // @ts-ignore unref exists in node
  (t as unknown as { unref?: () => void }).unref?.();
}
