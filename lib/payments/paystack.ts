import crypto from "node:crypto";

/**
 * Paystack client used by the billing routes.
 *
 * The secret key is read from the environment at call time (never at import,
 * never logged). Both `PAYSTACK_SECRET_KEY` and the live-specific name are
 * accepted so existing deployments keep working.
 */

const API_BASE = "https://api.paystack.co";
const TIMEOUT_MS = 15_000;

export class PaystackNotConfiguredError extends Error {
  constructor() {
    super("Paystack is not configured on this server");
    this.name = "PaystackNotConfiguredError";
  }
}

export class PaystackRequestError extends Error {
  constructor(message: string, readonly status = 502) {
    super(message);
    this.name = "PaystackRequestError";
  }
}

/**
 * Which env var supplied the secret key. Names only — never the value — so a
 * misconfigured deployment is diagnosable from server logs. Order matters:
 * PAYSTACK_SECRET_KEY wins, so a stale value there silently shadows a freshly
 * added PAYSTACK_LIVE_SECRET_KEY.
 */
export function paystackKeySource():
  | "PAYSTACK_SECRET_KEY"
  | "PAYSTACK_LIVE_SECRET_KEY"
  | "PAYSTACK_TEST_SECRET_KEY"
  | null {
  if (process.env.PAYSTACK_SECRET_KEY) return "PAYSTACK_SECRET_KEY";
  if (process.env.PAYSTACK_LIVE_SECRET_KEY) return "PAYSTACK_LIVE_SECRET_KEY";
  if (process.env.PAYSTACK_TEST_SECRET_KEY) return "PAYSTACK_TEST_SECRET_KEY";
  return null;
}

function secretKey(): string {
  const source = paystackKeySource();
  const key = source ? process.env[source] || "" : "";
  if (!key) throw new PaystackNotConfiguredError();
  return key;
}

export function paystackPublicKey(): string {
  return (
    process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ||
    process.env.PAYSTACK_LIVE_PUBLIC_KEY ||
    process.env.PAYSTACK_TEST_PUBLIC_KEY ||
    ""
  );
}

export function isPaystackConfigured(): boolean {
  return paystackKeySource() !== null;
}

/** GHS -> pesewas. Paystack works in the smallest currency unit. */
export function amountToPesewas(amountGhs: number): number {
  return Math.round(amountGhs * 100);
}

export function newReference(organizationId: string): string {
  const suffix = crypto.randomBytes(4).toString("hex");
  return `chr_${organizationId.slice(-6)}_${Date.now().toString(36)}_${suffix}`;
}

export function appBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "").replace(/\/$/, "");
}

interface PaystackEnvelope<T> {
  status: boolean;
  message: string;
  data: T;
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${secretKey()}`,
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
      signal: controller.signal,
      cache: "no-store",
    });
    const body = (await res.json().catch(() => null)) as PaystackEnvelope<T> | null;
    if (!res.ok || !body?.status) {
      throw new PaystackRequestError(body?.message || `Paystack request failed (${res.status})`, res.status);
    }
    return body.data;
  } catch (e) {
    if (e instanceof PaystackRequestError || e instanceof PaystackNotConfiguredError) throw e;
    if ((e as { name?: string })?.name === "AbortError") {
      throw new PaystackRequestError("Paystack did not respond in time", 504);
    }
    throw new PaystackRequestError("Could not reach Paystack", 502);
  } finally {
    clearTimeout(timer);
  }
}

export interface InitializeInput {
  email: string;
  amountPesewas: number;
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}

export async function initializeTransaction(input: InitializeInput) {
  return call<{ authorization_url: string; access_code: string; reference: string }>(
    "/transaction/initialize",
    {
      method: "POST",
      body: JSON.stringify({
        email: input.email,
        amount: input.amountPesewas,
        currency: "GHS",
        reference: input.reference,
        callback_url: input.callbackUrl,
        metadata: input.metadata,
      }),
    }
  );
}

export interface VerifiedTransaction {
  reference: string;
  status: "success" | "failed" | "abandoned" | "ongoing" | "pending";
  amount: number;
  currency: string;
  paid_at?: string | null;
  channel?: string;
  customer?: { email?: string };
}

export async function verifyTransaction(reference: string): Promise<VerifiedTransaction> {
  return call<VerifiedTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

/**
 * Paystack signs webhook bodies with HMAC-SHA512 using the secret key.
 * Constant-time compare prevents timing leaks.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = crypto.createHmac("sha512", secretKey()).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export interface PaystackWebhookEvent {
  event: string;
  data: VerifiedTransaction & {
    id?: number | string;
    metadata?: Record<string, unknown>;
  };
}
