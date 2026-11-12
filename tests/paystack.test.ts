import crypto from "node:crypto";
import { describe, it, expect, beforeAll } from "vitest";
import {
  amountToPesewas,
  isPaystackConfigured,
  newReference,
  verifyWebhookSignature,
} from "@/lib/payments/paystack";

beforeAll(() => {
  process.env.PAYSTACK_SECRET_KEY = "sk_test_unit_only_1234567890";
});

describe("paystack helpers", () => {
  it("converts GHS to pesewas", () => {
    expect(amountToPesewas(500)).toBe(50000);
    expect(amountToPesewas(750)).toBe(75000);
    expect(amountToPesewas(1000)).toBe(100000);
    expect(amountToPesewas(0.1)).toBe(10);
  });

  it("accepts a correctly signed webhook body", () => {
    const body = JSON.stringify({ event: "charge.success", data: { reference: "chr_test" } });
    const signature = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY as string).update(body).digest("hex");
    expect(verifyWebhookSignature(body, signature)).toBe(true);
  });

  it("rejects tampered payloads and missing signatures", () => {
    const body = JSON.stringify({ event: "charge.success", data: { reference: "chr_test" } });
    const signature = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY as string).update(body).digest("hex");
    expect(verifyWebhookSignature(body.replace("chr_test", "chr_evil"), signature)).toBe(false);
    expect(verifyWebhookSignature(body, null)).toBe(false);
    expect(verifyWebhookSignature(body, "deadbeef")).toBe(false);
  });

  it("generates reference strings scoped to the organisation", () => {
    const ref = newReference("65f000000000000000000001");
    expect(ref.startsWith("chr_")).toBe(true);
    expect(ref).toContain("000001");
    expect(ref.length).toBeLessThan(80);
    expect(newReference("65f000000000000000000001")).not.toBe(ref);
  });

  it("reports configuration from the environment", () => {
    expect(isPaystackConfigured()).toBe(true);
  });
});
