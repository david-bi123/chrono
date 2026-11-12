// Visual QA capture. Public pages always; authenticated pages when credentials
// are supplied via env (QA_EMAIL / QA_PASSWORD, QA_SUPER_EMAIL / QA_SUPER_PASSWORD).
// Writes to output/qa/.
import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.env.QA_BASE || "http://localhost:3000";
const OUT = "output/qa";
fs.mkdirSync(OUT, { recursive: true });

async function waitForServer() {
  for (let i = 0; i < 90; i++) {
    try {
      const res = await fetch(BASE);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`server never came up at ${BASE}`);
}

const VIEWPORTS = [
  ["desktop", { width: 1440, height: 1000 }],
  ["tablet", { width: 820, height: 1000 }],
  ["mobile", { width: 390, height: 844 }],
];

await waitForServer();
const browser = await chromium.launch();

if (!process.env.QA_SKIP_PUBLIC) {
  for (const [name, viewport] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.querySelectorAll(".reveal").forEach((el) => el.classList.remove("is-hidden")));
  await page.waitForTimeout(500);
  await page.waitForTimeout(600);
  // Element screenshot: captures the whole section even when it is taller than
  // the viewport (scrollIntoView would align the bottom and clip the cards).
  await page.locator("#pricing").screenshot({ path: `${OUT}/${name}-pricing-section.png` });
  await page.locator("#pricing table").screenshot({ path: `${OUT}/${name}-pricing-matrix.png` });
  await ctx.close();
  }
  console.log("public shots done");
}

// ---- authenticated ---------------------------------------------------------
/** Wait for client-side data fetches, not just the document. */
async function settle(page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page
    .waitForFunction(() => document.querySelectorAll(".skeleton").length === 0, { timeout: 25000 })
    .catch(() => {});
  await page.waitForTimeout(500);
}

async function login(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { waitUntil: "commit", timeout: 30000 });
  await page.waitForTimeout(2500);
}

const adminEmail = process.env.QA_EMAIL;
const adminPassword = process.env.QA_PASSWORD;

if (adminEmail && adminPassword) {
  for (const [name, viewport] of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport });
    const page = await ctx.newPage();
    await login(page, adminEmail, adminPassword);
    for (const [path, file] of [
      ["/dashboard", "dashboard"],
      ["/dashboard/subscription", "subscription"],
      ["/dashboard/managers", "managers"],
      ["/dashboard/staff", "staff"],
      ["/dashboard/attendance", "attendance"],
      ["/dashboard/reports", "reports"],
      ["/dashboard/settings", "settings"],
    ]) {
      await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
      await settle(page);
      await page.screenshot({ path: `${OUT}/${name}-${file}.png`, fullPage: true });
    }
    await ctx.close();
    console.log(`admin shots done (${name})`);
  }
}

const superEmail = process.env.QA_SUPER_EMAIL;
const superPassword = process.env.QA_SUPER_PASSWORD;

if (superEmail && superPassword) {
  for (const [name, viewport] of VIEWPORTS.slice(0, 2)) {
    const ctx = await browser.newContext({ viewport });
    const page = await ctx.newPage();
    await login(page, superEmail, superPassword);
    for (const [path, file] of [
      ["/super-admin", "super-home"],
      ["/super-admin/organizations", "super-orgs"],
      ["/super-admin/organizations/new", "super-new-org"],
      ["/super-admin/audit", "super-audit"],
    ]) {
      await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
      await settle(page);
      await page.screenshot({ path: `${OUT}/${name}-${file}.png`, fullPage: true });
    }
    // plan modal
    await page.goto(`${BASE}/super-admin/organizations`, { waitUntil: "networkidle" });
    await settle(page);
    await page.getByRole("button", { name: /^plan$/i }).first().click();
    await settle(page);
    await page.screenshot({ path: `${OUT}/${name}-super-plan-modal.png` });
    await ctx.close();
    console.log(`super-admin shots done (${name})`);
  }
}

// Manager invite modal (desktop only).
if (adminEmail && adminPassword && !process.env.QA_ONLY_SUPER) {
  const ctx = await browser.newContext({ viewport: VIEWPORTS[0][1] });
  const page = await ctx.newPage();
  await login(page, adminEmail, adminPassword);
  await page.goto(`${BASE}/dashboard/managers`, { waitUntil: "networkidle" });
  await settle(page);
  await page.getByRole("button", { name: /invite manager/i }).first().click();
  await settle(page);
  await page.screenshot({ path: `${OUT}/desktop-manager-invite-modal.png` });
  await ctx.close();
  console.log("manager invite modal captured");
}

await browser.close();
console.log("qa shots written to", OUT);
