/*
 * ChronoSwift service worker.
 *
 * Cache policy, deliberately conservative because this is a multi-tenant app
 * that gets used on shared phones:
 *   - static assets (hashed JS/CSS, icons, fonts): cache-first
 *   - navigations: network-first, offline page as fallback, response NEVER cached
 *   - API endpoints: untouched, always straight to the network
 *
 * That last rule matters: caching an authenticated API response or HTML page
 * could show one organisation's data to whoever holds the device next.
 */
const VERSION = "2026-11-13.1";
const SHELL = `chrono-shell-${VERSION}`;
const ASSETS = `chrono-assets-${VERSION}`;
const PRECACHE = [
  "/offline",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(PRECACHE))
      // A failed precache must not block activation; the shell just falls back
      // to the browser's offline page.
      .catch(() => undefined)
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key.startsWith("chrono-") && key !== SHELL && key !== ASSETS).map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:woff2?|css|png|svg|jpe?g|webp|ico)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Data and auth never enter the cache.
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cache = await caches.open(SHELL);
          return (await cache.match("/offline")) || Response.error();
        }
      })()
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSETS);
        const hit = await cache.match(request);
        if (hit) return hit;
        const response = await fetch(request);
        if (response && response.ok) cache.put(request, response.clone());
        return response;
      })()
    );
  }
});
