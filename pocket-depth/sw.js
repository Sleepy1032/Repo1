// Pocket Depth service worker: keeps the page, the ONNX runtime and the Small model
// on the device so the app opens and runs with no connection.

const SHELL = "pd-shell-v2";   // bump to ship a new page
const ASSETS = "pd-assets-v1"; // big files that never change; kept across page updates
const FONTS = "pd-fonts-v1";

const SHELL_FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icon.svg",
  "icon-192.png",
  "icon-512.png",
  "apple-touch-icon.png",
  "vendor/ort.webgpu.bundle.min.mjs",
];
const BIG_FILES = [
  "vendor/ort-wasm-simd-threaded.jsep.wasm",
  "models/depth-anything-v2-small.onnx",
].map((p) => new URL(p, self.registration.scope).href);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keep = [SHELL, ASSETS, FONTS];
    for (const k of await caches.keys()) if (!keep.includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

// Big files: from the cache, or fetched once and saved.
async function cacheFirst(req, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) await cache.put(req, res.clone());
  return res;
}

// Page and small files: answer from the cache right away, refresh it in the background.
async function staleWhileRevalidate(req, name, fallbackKey) {
  const cache = await caches.open(name);
  const hit = await cache.match(req, { ignoreSearch: true }) || (fallbackKey && await cache.match(fallbackKey));
  const fresh = fetch(req).then((res) => {
    if (res.ok || res.type === "opaque") cache.put(req, res.clone());
    return res;
  }).catch(() => null);
  return hit || (await fresh) || Response.error();
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(staleWhileRevalidate(req, FONTS));
    return;
  }
  if (url.origin !== self.location.origin) return;

  if (BIG_FILES.includes(url.href)) {
    event.respondWith(cacheFirst(req, ASSETS));
  } else if (req.mode === "navigate") {
    event.respondWith(staleWhileRevalidate(req, SHELL, "index.html"));
  } else {
    event.respondWith(staleWhileRevalidate(req, SHELL));
  }
});
