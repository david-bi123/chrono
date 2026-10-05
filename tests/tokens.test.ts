import { describe, it, expect } from "vitest";
import { hashToken, generateRawToken } from "../lib/auth/tokens";

describe("tokens", () => {
  it("hashes are deterministic and raw is random", () => {
    const a = generateRawToken();
    const b = generateRawToken();
    expect(a).not.toBe(b);
    expect(hashToken(a)).toBe(hashToken(a));
    expect(hashToken(a)).not.toBe(hashToken(b));
  });
});
