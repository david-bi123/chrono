// Screenshot capture for marketing/showcase-screenshots.
// Captures the REAL running app. Public pages only (auth flows to be added
// once demo credentials are provided).
import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.env.SCREENSHOT_BASE || "http://localhost:3000";
const OUT = "C:/Users/HP/Documents/chrono/marketing/showcase-screenshots";

const DESKTOP = { width: 1440, height: 1000 };
const MOBILE = { width: 390, height: 844 };

for (const d of ["desktop", "mobile", "full-page", "feature-highlights"]) {
  fs.mkdirSync(`${OUT}/${d}`, { recursive: true });
}

const browser = await chromium.launch();

async function shoot(page, rel, { fullPage = false } = {}) {
  const path = `${OUT}/${rel}`;
  await page.screenshot({ path, fullPage });
  console.log("saved:", path);
}

// ---------- Desktop: landing ----------
{
  const ctx = await browser.newContext({ viewport: DESKTOP });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.evaluate(() => document.querySelectorAll(".reveal").forEach((el) => el.classList.remove("is-hidden")));
  await shoot(page, "full-page/landing-full.png", { fullPage: true });
  await shoot(page, "desktop/landing-hero.png");
  for (const [id, file] of [
    ["features", "desktop/landing-features.png"],
    ["how", "desktop/landing-how-it-works.png"],
    ["security", "desktop/landing-security.png"],
    ["faq", "desktop/landing-faq.png"],
  ]) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    await shoot(page, file);
  }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1200);
  await shoot(page, "desktop/landing-cta.png");
  await ctx.close();
}

// ---------- Desktop: legal + auth ----------
{
  const ctx = await browser.newContext({ viewport: DESKTOP });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/terms`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await shoot(page, "full-page/terms-full.png", { fullPage: true });
  await shoot(page, "desktop/terms.png");
  await page.goto(`${BASE}/privacy`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await shoot(page, "full-page/privacy-full.png", { fullPage: true });
  await shoot(page, "desktop/privacy.png");
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await shoot(page, "desktop/login.png");
  await ctx.close();
}

// ---------- Mobile: landing + login ----------
{
  const ctx = await browser.newContext({ viewport: MOBILE });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.evaluate(() => document.querySelectorAll(".reveal").forEach((el) => el.classList.remove("is-hidden")));
  await shoot(page, "mobile/landing-full.png", { fullPage: true });
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await shoot(page, "mobile/login-full.png", { fullPage: true });
  await ctx.close();
}

await browser.close();
console.log("ALL SHOTS CAPTURED");
