import { describe, it, expect } from "vitest";
import { hashToken, generateRawToken, generateSlug } from "../lib/auth/tokens";

describe("tokens", () => {
  it("hashes are deterministic and raw is random", () => {
    const a = generateRawToken();
    const b = generateRawToken();
    expect(a).not.toBe(b);
    expect(hashToken(a)).toBe(hashToken(a));
    expect(hashToken(a)).not.toBe(hashToken(b));
  });
  it("hash output is a 64-char hex digest", () => {
    expect(hashToken("chr_test")).toMatch(/^[a-f0-9]{64}$/);
  });
  it("slugs are URL-safe and unique", () => {
    const a = generateSlug("Acme Technologies!");
    const b = generateSlug("Acme Technologies!");
    expect(a).toMatch(/^[a-z0-9-]+$/);
    expect(a.startsWith("acme-technologies-")).toBe(true);
    expect(a).not.toBe(b);
    expect(generateSlug("")).toMatch(/^org-[a-f0-9]+$/);
  });
});
