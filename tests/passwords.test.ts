import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../lib/auth/password";

describe("passwords", () => {
  it("hashes verify correctly and salts uniquely", async () => {
    const h1 = await hashPassword("Strong1Pass");
    const h2 = await hashPassword("Strong1Pass");
    expect(h1).not.toBe(h2);
    expect(await verifyPassword("Strong1Pass", h1)).toBe(true);
    expect(await verifyPassword("Wrong1Pass", h1)).toBe(false);
    expect(await verifyPassword("", h1)).toBe(false);
    expect(await verifyPassword("Strong1Pass", "")).toBe(false);
  }, 15000);
});
