import { describe, it, expect } from "vitest";
import { safeNextPath } from "../lib/auth/redirect";

describe("safeNextPath", () => {
  it("allows same-origin app paths", () => {
    expect(safeNextPath("/dashboard")).toBe("/dashboard");
    expect(safeNextPath("/attendance/scan/chr_abc123")).toBe("/attendance/scan/chr_abc123");
    expect(safeNextPath("/staff?tab=x")).toBe("/staff?tab=x");
    expect(safeNextPath("/")).toBe("/");
  });
  it("rejects absolute and protocol-relative URLs", () => {
    expect(safeNextPath("https://evil.com")).toBe("");
    expect(safeNextPath("http://evil.com/x")).toBe("");
    expect(safeNextPath("//evil.com")).toBe("");
    expect(safeNextPath("///evil.com")).toBe("");
  });
  it("rejects scheme tricks and backslashes", () => {
    expect(safeNextPath("/javascript:alert(1)")).toBe("");
    expect(safeNextPath("/https://evil.com")).toBe("");
    expect(safeNextPath("/\\evil.com")).toBe("");
    expect(safeNextPath("javascript:alert(1)")).toBe("");
  });
  it("rejects empty and non-path input", () => {
    expect(safeNextPath("")).toBe("");
    expect(safeNextPath(null)).toBe("");
    expect(safeNextPath(undefined)).toBe("");
    expect(safeNextPath("dashboard")).toBe("");
    expect(safeNextPath("   ")).toBe("");
  });
});
