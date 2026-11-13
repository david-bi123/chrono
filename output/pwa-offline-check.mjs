/**
 * Offline behaviour: a navigation with no network must land on the cached
 * offline page, and no API response may ever be stored in a cache.
 *
 * Usage: QA_BASE=http://localhost:3111 node output/pwa-offline-check.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.QA_BASE || "http://localhost:3111";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();

await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.evaluate(() => navigator.serviceWorker.ready);
await page.reload({ waitUntil: "networkidle" });

const cachedUrls = await page.evaluate(async () => {
  const out = [];
  for (const key of await caches.keys()) {
    const cache = await caches.open(key);
    for (const req of await cache.keys()) out.push(new URL(req.url).pathname);
  }
  return out;
});

const apiCached = cachedUrls.filter((p) => p.startsWith("/api/"));
console.log(`cached entries: ${cachedUrls.length}`);
console.log(`cached API paths: ${apiCached.length ? apiCached.join(", ") : "none"}`);
console.log(`${apiCached.length === 0 ? "PASS" : "FAIL"}  no API responses in the cache`);
console.log(`${cachedUrls.includes("/offline") ? "PASS" : "FAIL"}  offline page precached`);

await ctx.setOffline(true);
let body = "";
try {
  await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded", timeout: 15000 });
  body = await page.content();
} catch {
  body = await page.content().catch(() => "");
}
const showsOffline = /you('|&#x27;|’)?re offline/i.test(body);
console.log(`${showsOffline ? "PASS" : "FAIL"}  offline navigation shows the branded page`);
await page.screenshot({ path: "output/qa/mobile-offline.png", fullPage: true });

await browser.close();
if (apiCached.length || !showsOffline) process.exitCode = 1;
