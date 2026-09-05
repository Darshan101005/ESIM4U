// Minimal service worker for PWA installability. Network-first passthrough with
// a cache fallback so the app can be installed and opened when offline.
const CACHE = "esim4u-cache-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  event.respondWith(
    (async () => {
      try {
        const fresh = await fetch(req);
        // Cache successful same-origin GETs for offline fallback.
        if (fresh && fresh.status === 200 && new URL(req.url).origin === self.location.origin) {
          const cache = await caches.open(CACHE);
          cache.put(req, fresh.clone());
        }
        return fresh;
      } catch {
        const cached = await caches.match(req);
        if (cached) return cached;
        // Last resort for navigations.
        if (req.mode === "navigate") {
          const home = await caches.match("/");
          if (home) return home;
        }
        throw new Error("Network error and no cache available");
      }
    })()
  );
});
