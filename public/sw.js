/* Invoicer by Swaniki — service worker.
   Served as a static asset so it works on any host (Vercel, plain static).
   Strategy: precache the app shell (every route), then serve navigations
   network-first (cache on success) so deployed updates reach clients on the
   next reload. Static hashed chunks are cache-first. While offline the shell
   cache keeps the app fully usable. Bump VERSION to force a fresh shell. */

const VERSION = "v1.0.0-m16c";
const CACHE = `invoicer-swaniki-${VERSION}`;

const SHELL = [
  "/",
  "/home",
  "/invoices",
  "/quotations",
  "/customers",
  "/products",
  "/settings",
  "/invoice/new",
  "/manifest.webmanifest",
  "/icon.svg",
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon-180.png",
  "/fonts/Poppins-Regular.ttf",
  "/fonts/Poppins-Bold.ttf",
  "/fonts/Tinos-Regular.ttf",
  "/fonts/Tinos-Bold.ttf",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        Promise.all(
          SHELL.map((url) =>
            cache.add(url).catch(() => {
              /* A single failed route must not block activation. */
            })
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function resolveRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  return caches.match(path).then((hit) => {
    if (hit) return hit;
    if (path.endsWith("/")) return caches.match(`${path}index.html`);
    return caches.match(`${path}.html`);
  });
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigations: network first (so updates reach clients), cache on success,
  // and fall back to the offline shell when the network is unavailable.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          resolveRequest(request).then((cached) => cached || caches.match("/"))
        )
    );
    return;
  }

  // Static assets (hashed chunks are immutable): cache-first, fill on the
  // fly, never break the app.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          if (request.destination === "document") return caches.match("/");
          return undefined;
        });
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
