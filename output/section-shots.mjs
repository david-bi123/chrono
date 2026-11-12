import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.env.PREVIEW_BASE || "http://localhost:3001";
const OUT = "output/preview/sections";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function open(viewport) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.evaluate(() =>
    document.querySelectorAll(".reveal").forEach((el) => el.classList.remove("is-hidden"))
  );
  await page.waitForTimeout(500);
  return { ctx, page };
}

for (const [name, viewport] of [
  ["desktop", { width: 1440, height: 1000 }],
  ["mobile", { width: 390, height: 844 }],
]) {
  const { ctx, page } = await open(viewport);

  for (const [id, label] of [
    ["how", "how"],
    ["features", "features"],
    ["rules", "rules"],
    ["roles", "roles"],
    ["security", "security"],
    ["faq", "faq"],
  ]) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.locator(`#${id}`).screenshot({ path: `${OUT}/${name}-${label}.png` });
  }

  if (name === "mobile") {
    for (const tab of ["overview", "qr", "clock"]) {
      await page.locator(`#tour-tab-${tab}`).click();
      await page.waitForTimeout(300);
      await page.locator("#product").screenshot({ path: `${OUT}/mobile-tour-${tab}.png` });
    }
    await page.locator("main > section").last().screenshot({ path: `${OUT}/mobile-cta.png` });
  } else {
    await page.locator("main > section").last().screenshot({ path: `${OUT}/desktop-cta.png` });
    await page.locator("#faq").screenshot({ path: `${OUT}/desktop-faq.png` });
  }

  await ctx.close();
}

await browser.close();
console.log("section shots written");
