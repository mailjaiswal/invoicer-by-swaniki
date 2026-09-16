/* Invoicer by Swaniki — service worker.
   Served as a static asset so it works on any host (Vercel, plain static).
   Offline strategy: precache the app shell (every route), then cache
   everything else on first use. Bump VERSION to invalidate clients. */

const VERSION = "v1.0.0-m9";
const CACHE = `invoicer-swaniki-${VERSION}`;

const SHELL = [
  "/",
  "/home",
  "/invoices",
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
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
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

  // Navigations: shell cache → network (cache on success) → offline shell.
  if (request.mode === "navigate") {
    event.respondWith(
      caches
        .match(request)
        .then((cached) => cached || resolveRequest(request))
        .then((cached) => {
          if (cached) return cached;
          return fetch(request)
            .then((response) => {
              if (response.ok) {
                const clone = response.clone();
                caches.open(CACHE).then((cache) => cache.put(request, clone));
              }
              return response;
            })
            .catch(() => caches.match("/"));
        })
    );
    return;
  }

  // Static assets: cache-first, fill on the fly, never break the app.
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