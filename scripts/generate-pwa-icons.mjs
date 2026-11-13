/**
 * Rasterises the ChronoSwift clock mark into the PNG sizes the PWA manifest and
 * iOS need. The source is app/icon.svg, redrawn here at any size so the result
 * stays crisp instead of upscaling a favicon.
 *
 * Usage: node scripts/generate-pwa-icons.mjs
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BRAND = "#39765A";
const FACE = "#FFFFFF";
const DOT = "#E1ECE6";
const OUT = path.resolve("public/icons");

function mark({ size, radius, glyph }) {
  const c = size / 2;
  const r = glyph / 2;
  const stroke = Math.max(1.4, size * 0.065);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="${BRAND}"/>
  <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${FACE}" stroke-width="${stroke}"/>
  <path d="M${c} ${c - r * 0.62}V${c}l${r * 0.42} ${r * 0.26}" fill="none" stroke="${FACE}"
        stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="${c}" cy="${c}" r="${Math.max(1.2, size * 0.045)}" fill="${DOT}"/>
</svg>`;
}

const TARGETS = [
  // Standard install icons: rounded square, clock filling most of the tile.
  { file: "icon-192.png", size: 192, radius: 42, glyph: 100 },
  { file: "icon-512.png", size: 512, radius: 112, glyph: 268 },
  // Maskable: full bleed, glyph inside the 80% safe zone so Android can crop it
  // into a circle or squircle without clipping the hands.
  { file: "icon-maskable-512.png", size: 512, radius: 0, glyph: 230 },
  // iOS applies its own mask, so ship a square.
  { file: "apple-touch-icon.png", size: 180, radius: 0, glyph: 96 },
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();

for (const target of TARGETS) {
  const page = await browser.newPage({ viewport: { width: target.size, height: target.size } });
  const svg = mark(target);
  await page.setContent(
    `<!doctype html><html><body style="margin:0;background:${BRAND}">${svg}</body></html>`,
    { waitUntil: "load" }
  );
  await page.screenshot({ path: path.join(OUT, target.file) });
  await page.close();
  console.log(`wrote public/icons/${target.file} (${target.size}x${target.size})`);
}

await browser.close();
