/**
 * Verifies the installable-app setup against a running production build:
 * manifest fields, icon sizes, service worker lifecycle, the offline fallback,
 * role-aware /start redirect, and the settings install card.
 *
 * Usage: QA_BASE=http://localhost:3111 QA_EMAIL=... QA_PASSWORD=... node output/pwa-check.mjs
 */
import { chromium } from "playwright";
import path from "node:path";

const BASE = process.env.QA_BASE || "http://localhost:3111";
const OUT = path.resolve("output/qa");
const EMAIL = process.env.QA_EMAIL;
const PASSWORD = process.env.QA_PASSWORD;

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

const browser = await chromium.launch();

// --- public surface -------------------------------------------------------
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();

await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });

const manifestHref = await page.getAttribute('link[rel="manifest"]', "href");
check("manifest is linked from the document", Boolean(manifestHref), manifestHref || "missing");

const manifest = await (await ctx.request.get(`${BASE}/manifest.webmanifest`)).json();
check("manifest name/short_name", manifest.name === "ChronoSwift — Smart attendance" && manifest.short_name === "ChronoSwift", `${manifest.name} / ${manifest.short_name}`);
check("manifest is standalone", manifest.display === "standalone", String(manifest.display));
check("manifest start_url resolves by role", manifest.start_url === "/start", String(manifest.start_url));
check("manifest has 192 and 512 icons", ["192x192", "512x512"].every((s) => manifest.icons.some((i) => i.sizes === s)), manifest.icons.map((i) => i.sizes).join(","));
check("manifest has a maskable icon", manifest.icons.some((i) => (i.purpose || "").includes("maskable")));

for (const icon of ["/icons/icon-192.png", "/icons/icon-512.png", "/icons/icon-maskable-512.png", "/icons/apple-touch-icon.png"]) {
  const res = await ctx.request.get(`${BASE}${icon}`);
  check(`icon served ${icon}`, res.status() === 200 && (res.headers()["content-type"] || "").includes("image/png"), String(res.status()));
}

const apple = await page.getAttribute('link[rel="apple-touch-icon"]', "href");
check("apple-touch-icon for iOS installs", Boolean(apple), apple || "missing");

const worker = await ctx.request.get(`${BASE}/sw.js`);
check("service worker script served", worker.status() === 200, String(worker.status()));

// --- worker lifecycle -----------------------------------------------------
const registered = await page.evaluate(async () => {
  if (!("serviceWorker" in navigator)) return { supported: false };
  const reg = await navigator.serviceWorker.ready;
  return { supported: true, scope: reg.scope, active: Boolean(reg.active) };
});
check("service worker registers and activates", registered.supported && registered.active, registered.scope || "n/a");

await page.reload({ waitUntil: "networkidle" });
const controlled = await page.evaluate(() => Boolean(navigator.serviceWorker.controller));
check("page is controlled after reload", controlled);

const offline = await page.evaluate(async () => {
  const res = await fetch("/offline");
  const text = await res.text();
  return { status: res.status, hasCopy: text.includes("You&#x27;re offline") || text.includes("You're offline") };
});
check("offline page renders", offline.status === 200 && offline.hasCopy, `status ${offline.status}`);

const cachedOffline = await page.evaluate(async () => {
  const keys = await caches.keys();
  const shell = keys.find((k) => k.startsWith("chrono-shell-"));
  if (!shell) return false;
  const cache = await caches.open(shell);
  return Boolean(await cache.match("/offline"));
});
check("offline page is precached", cachedOffline);

const started = await page.request.get(`${BASE}/start`, { maxRedirects: 0 });
check("start redirects a signed-out launch to /login", started.status() === 307 && (started.headers()["location"] || "").includes("/login"), started.headers()["location"] || "");

// --- authenticated surfaces ----------------------------------------------
if (EMAIL && PASSWORD) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.fill("#email", EMAIL);
  await page.fill("#password", PASSWORD);
  await Promise.all([
    page.waitForURL(/\/dashboard/, { waitUntil: "commit" }),
    page.getByRole("button", { name: /sign in/i }).click(),
  ]);

  await page.goto(`${BASE}/start`, { waitUntil: "commit" });
  await page.waitForURL(/\/dashboard/, { waitUntil: "commit" });
  check("start sends a signed-in admin to /dashboard", page.url().includes("/dashboard"), page.url().replace(BASE, ""));

  await page.goto(`${BASE}/dashboard/settings`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: /app/i }).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/mobile-settings-app.png`, fullPage: true });
  const installCopy = await page.getByText(/install the app/i).first().isVisible();
  check("settings shows the install card", installCopy);
}

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) process.exitCode = 1;
