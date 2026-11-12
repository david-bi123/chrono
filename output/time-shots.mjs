// Capture the hero + sign-in page after the clock/hourglass swap.
import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.env.PREVIEW_BASE || "http://localhost:3001";
const OUT = "output/preview-time";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

for (const [name, viewport] of [
  ["laptop", { width: 1366, height: 657 }],
  ["desktop", { width: 1440, height: 1000 }],
  ["tablet", { width: 820, height: 1000 }],
  ["mobile", { width: 390, height: 844 }],
]) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/${name}-hero.png` });

  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/${name}-login.png`, fullPage: true });

  await ctx.close();
}

await browser.close();
console.log("time shots written to", OUT);
