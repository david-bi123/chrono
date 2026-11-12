// Preview capture for the landing page redesign. Writes to output/preview/.
import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.env.PREVIEW_BASE || "http://localhost:3000";
const OUT = "output/preview";
fs.mkdirSync(OUT, { recursive: true });

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(BASE);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("server never came up");
}

await waitForServer();
const browser = await chromium.launch();

for (const [name, viewport] of [
  ["desktop", { width: 1440, height: 1000 }],
  ["mobile", { width: 390, height: 844 }],
  ["tablet", { width: 820, height: 1000 }],
]) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.evaluate(() =>
    document.querySelectorAll(".reveal").forEach((el) => el.classList.remove("is-hidden"))
  );
  await page.screenshot({ path: `${OUT}/${name}-full.png`, fullPage: true });
  await page.screenshot({ path: `${OUT}/${name}-hero.png` });

  if (name === "desktop") {
    // Product tour tabs
    for (const id of ["qr", "clock"]) {
      await page.locator(`#tour-tab-${id}`).click();
      await page.waitForTimeout(400);
      await page.locator("#product").scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollBy(0, -80));
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${OUT}/tour-${id}.png` });
    }
    // Mobile nav open
    const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mobilePage = await mobileCtx.newPage();
    await mobilePage.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await mobilePage.getByRole("button", { name: "Open menu" }).click();
    await mobilePage.waitForTimeout(300);
    await mobilePage.screenshot({ path: `${OUT}/mobile-menu.png` });
    await mobileCtx.close();
  }
  await ctx.close();
}

await browser.close();
console.log("preview shots written to", OUT);
