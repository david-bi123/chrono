/**
 * Annotated install guide shots: red box + label on the exact control, so the
 * steps can be shown without describing "somewhere in the header".
 *
 * Usage: node output/install-guide-shots.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.QA_BASE || "https://chronoswift.vercel.app";
const OUT = "output/qa";

function annotate() {
  const style = document.createElement("style");
  style.textContent = `
    .guide-ring { outline: 3px solid #e11d48 !important; outline-offset: 4px !important; border-radius: 14px !important; }
    .guide-tag { position: fixed; z-index: 60; background: #e11d48; color: #fff; font: 600 12px/1.2 system-ui, sans-serif;
      padding: 6px 9px; border-radius: 999px; box-shadow: 0 6px 18px rgba(225,29,72,.35); pointer-events: none; }
  `;
  document.head.appendChild(style);

  window.__guide = (selector, tag, offsetY = -34) => {
    const el = document.querySelector(selector);
    if (!el) return false;
    el.classList.add("guide-ring");
    const r = el.getBoundingClientRect();
    const label = document.createElement("div");
    label.className = "guide-tag";
    label.textContent = tag;
    label.style.left = `${Math.max(8, r.left)}px`;
    label.style.top = `${Math.max(8, r.top + offsetY)}px`;
    document.body.appendChild(label);
    return true;
  };
}

const browser = await chromium.launch();

// --- phone: landing menu row ----------------------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.waitForTimeout(400);
  await page.evaluate(annotate);
  const ok = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll("#mobile-nav li"));
    const row = rows.find((li) => /install the app/i.test(li.textContent || ""));
    if (!row) return false;
    row.classList.add("guide-ring");
    const r = row.getBoundingClientRect();
    const label = document.createElement("div");
    label.className = "guide-tag";
    label.textContent = "Tap here";
    label.style.left = `${Math.max(8, r.left + 8)}px`;
    label.style.top = `${Math.max(8, r.top - 32)}px`;
    document.body.appendChild(label);
    return true;
  });
  console.log("mobile menu row found:", ok);
  await page.screenshot({ path: `${OUT}/guide-phone-menu.png` });
  await ctx.close();
}

// --- phone: install dialog -------------------------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Install the app" }).first().click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/guide-phone-dialog.png` });
  await ctx.close();
}

// --- desktop: header button ------------------------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(annotate);
  const ok = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("header button")).find(
      (b) => b.offsetParent !== null && /get the app/i.test(b.textContent || "")
    );
    if (!btn) return false;
    btn.classList.add("guide-ring");
    const r = btn.getBoundingClientRect();
    const label = document.createElement("div");
    label.className = "guide-tag";
    label.textContent = "Click here";
    label.style.left = `${Math.max(8, r.left - 6)}px`;
    label.style.top = `${Math.min(window.innerHeight - 40, r.bottom + 6)}px`;
    document.body.appendChild(label);
    return true;
  });
  console.log("desktop header button found:", ok);
  await page.screenshot({
    path: `${OUT}/guide-desktop-header.png`,
    clip: { x: 0, y: 0, width: 1440, height: 150 },
  });
  await ctx.close();
}

await browser.close();
