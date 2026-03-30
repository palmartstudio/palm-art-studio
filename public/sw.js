// Palm Art Studio — Service Worker
const CACHE_NAME = "pas-admin-v1";
const PRECACHE = ["/admin", "/icons/icon-192x192.png", "/icons/icon-512x512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // Skip non-GET and cross-origin
  if (event.request.method !== "GET" || url.origin !== location.origin) return;
  // API routes: network only
  if (url.pathname.startsWith("/api/")) return;
  // Static assets: cache-first
  if (url.pathname.startsWith("/icons/") || url.pathname.endsWith(".png") || url.pathname.endsWith(".ico")) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request).then((resp) => {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        return resp;
      }))
    );
    return;
  }
  // HTML pages: network-first with cache fallback
  if (event.request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(event.request).then((resp) => {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        return resp;
      }).catch(() => caches.match(event.request).then((c) => c || caches.match("/admin")))
    );
  }
});
