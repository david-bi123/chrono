import { describe, it, expect, vi, afterEach } from "vitest";
import { rateLimit } from "../lib/rate-limit";

describe("rateLimit", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows up to the limit then blocks", () => {
    const key = `test-${Date.now()}-a`;
    for (let i = 0; i < 5; i++) {
      expect(rateLimit(key, 5, 60_000).ok).toBe(true);
    }
    const blocked = rateLimit(key, 5, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("resets after the window passes", () => {
    vi.useFakeTimers();
    const key = `test-${Date.now()}-b`;
    vi.setSystemTime(1_000_000);
    expect(rateLimit(key, 1, 60_000).ok).toBe(true);
    expect(rateLimit(key, 1, 60_000).ok).toBe(false);
    vi.setSystemTime(1_000_000 + 60_001);
    expect(rateLimit(key, 1, 60_000).ok).toBe(true);
  });

  it("tracks keys independently", () => {
    const t = Date.now();
    expect(rateLimit(`k1-${t}`, 1, 60_000).ok).toBe(true);
    expect(rateLimit(`k1-${t}`, 1, 60_000).ok).toBe(false);
    expect(rateLimit(`k2-${t}`, 1, 60_000).ok).toBe(true);
  });
});
