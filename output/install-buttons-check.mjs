/**
 * Install-button coverage: landing header (lg/xl), mobile menu, closing CTA,
 * the dashboard shell, the manual-instructions dialog, the native prompt path
 * and the "already installed, so hide it" case.
 *
 * Usage: QA_BASE=http://localhost:3111 QA_EMAIL=... QA_PASSWORD=... node output/install-buttons-check.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.QA_BASE || "http://localhost:3111";
const OUT = "output/qa";
const EMAIL = process.env.QA_EMAIL;
const PASSWORD = process.env.QA_PASSWORD;

let pass = 0;
let fail = 0;
function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  ok ? pass++ : fail++;
}

const browser = await chromium.launch();

// --- desktop 1440: labelled header button + dialog -------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });

  const headerBtn = page.getByRole("button", { name: "Get the app" });
  check("header shows 'Get the app' at 1440", await headerBtn.isVisible());
  await page.screenshot({ path: `${OUT}/desktop-landing-install-header.png`, clip: { x: 0, y: 0, width: 1440, height: 80 } });

  await headerBtn.click();
  const dialog = page.getByRole("dialog");
  check("button opens the install dialog without a native prompt", await dialog.isVisible());
  check("dialog explains the browser-menu path", await page.getByText(/from your browser menu/i).isVisible());
  await page.screenshot({ path: `${OUT}/desktop-install-dialog.png` });
  await page.keyboard.press("Escape");

  const ctaBtn = page.getByRole("button", { name: "Install the app" }).last();
  await ctaBtn.scrollIntoViewIfNeeded();
  check("closing CTA offers install", await ctaBtn.isVisible());
  await page.screenshot({ path: `${OUT}/desktop-landing-install-cta.png`, fullPage: false });
  await ctx.close();
}

// --- tablet 1100: icon-only header button ----------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  const iconBtn = page.getByRole("button", { name: "Install app", exact: true }).first();
  check("header shows an icon install button at 1100", await iconBtn.isVisible());
  await page.screenshot({ path: `${OUT}/tablet-landing-install-header.png`, clip: { x: 0, y: 0, width: 1100, height: 80 } });
  await ctx.close();
}

// --- mobile 390: menu entry + dialog + menu closes -------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Open menu" }).click();
  const menuItem = page.getByRole("button", { name: "Install the app" }).first();
  check("mobile menu lists install", await menuItem.isVisible());
  await page.screenshot({ path: `${OUT}/mobile-landing-install-menu.png` });
  await menuItem.click();
  check("mobile install opens the dialog", await page.getByRole("dialog").isVisible());
  check("mobile menu closes behind the dialog", !(await page.locator("#mobile-nav").isVisible()));
  await page.screenshot({ path: `${OUT}/mobile-install-dialog.png` });
  await ctx.close();
}

// --- native prompt path ----------------------------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    const ev = new Event("beforeinstallprompt");
    ev.prompt = async () => {
      window.__prompted = true;
    };
    ev.userChoice = Promise.resolve({ outcome: "accepted" });
    window.dispatchEvent(ev);
  });
  await page.getByRole("button", { name: "Get the app" }).click();
  await page.waitForTimeout(400);
  check("native prompt is used when the browser offers it", await page.evaluate(() => window.__prompted === true));
  check("no dialog is shown after a successful prompt", !(await page.getByRole("dialog").isVisible().catch(() => false)));
  await ctx.close();
}

// --- already installed: buttons disappear ---------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => {
    const original = window.matchMedia.bind(window);
    window.matchMedia = (query) =>
      query.includes("display-mode: standalone")
        ? {
            matches: true,
            media: query,
            onchange: null,
            addEventListener() {},
            removeEventListener() {},
            addListener() {},
            removeListener() {},
            dispatchEvent: () => false,
          }
        : original(query);
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  const count = await page.getByRole("button", { name: /get the app/i }).count();
  check("install button hides inside the installed app", count === 0, `${count} found`);
  await ctx.close();
}

// --- dashboard shell (admin) ----------------------------------------------
if (EMAIL && PASSWORD) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // The sign-in form is a client component, so clicking before hydration is a
  // no-op. Wait for the network to settle and retry once if the click was cold.
  let signedIn = false;
  for (let attempt = 1; attempt <= 3 && !signedIn; attempt++) {
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await page.fill("#email", EMAIL);
    await page.fill("#password", PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    signedIn = await page
      .waitForURL(/\/dashboard/, { timeout: 20000 })
      .then(() => true)
      .catch(() => false);
  }

  check("dashboard reached with the QA account", signedIn, page.url());
  if (signedIn) {
    await page.waitForLoadState("networkidle");
    const shellBtn = page.getByRole("button", { name: "Install app", exact: true }).first();
    // The shell streams in behind the route's loading skeleton, so give the
    // topbar a moment before asserting visibility.
    const visible = await shellBtn
      .waitFor({ state: "visible", timeout: 20000 })
      .then(() => true)
      .catch(() => false);
    check("dashboard topbar has an install button", visible);
    await page.screenshot({ path: `${OUT}/desktop-shell-install-button.png`, clip: { x: 0, y: 0, width: 1440, height: 70 } });
    await shellBtn.click();
    check("dashboard install opens the dialog", await page.getByRole("dialog").isVisible());
  }
  await ctx.close();
}

// --- installed-app launch, signed out --------------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/start`, { waitUntil: "networkidle" });
  check("signed-out launch lands on sign-in", page.url().includes("/login"), page.url().replace(BASE, ""));
  check(
    "sign-in explains the one-time app sign-in",
    await page.getByText(/you opened the installed app/i).isVisible()
  );
  await page.screenshot({ path: `${OUT}/mobile-app-launch-signin.png` });
  await ctx.close();
}

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exitCode = 1;
