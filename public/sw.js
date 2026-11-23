/*
 * Orbit service worker — installation basics only.
 *
 * SECURITY CONTRACT
 * -----------------
 * This worker never stores, caches, or replays anything private:
 *   - Navigation requests (every authenticated page) go straight to the network.
 *   - All /api/* requests go straight to the network.
 *   - The access screen and session endpoints are never cached.
 *   - Only immutable public branding assets are cached.
 *
 * There is no offline fallback for private routes, so an offline state can
 * never masquerade as a verified authentication. Passwords are never stored
 * or compared here — the service worker is not a security gate.
 */

const CACHE_NAME = "orbit-static-v2";

/** Public, non-sensitive assets safe to keep offline. */
const PRECACHE_URLS = [
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key.startsWith("orbit-static-") && key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

/** True when the request must never touch the cache. */
function isPrivateRequest(request) {
  const url = new URL(request.url);

  // Only same-origin GETs are ever considered.
  if (url.origin !== self.location.origin) return true;
  if (request.method !== "GET") return true;
  if (!PRECACHE_URLS.includes(url.pathname) || url.search) return true;

  // Private server endpoints and session negotiation.
  if (url.pathname.startsWith("/api/")) return true;

  // Every page navigation may be authenticated — never cache it.
  if (request.mode === "navigate") return true;

  // The access screen and auth endpoints.
  if (url.pathname === "/login" || url.pathname.startsWith("/login/")) return true;

  // Build output is handled by the browser's own HTTP cache.
  if (url.pathname.startsWith("/_next/")) return true;

  return false;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (isPrivateRequest(request)) {
    // Bypass the cache entirely for anything private.
    return;
  }

  const url = new URL(request.url);

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);

      // Stale-while-revalidate for public static assets only.
      return cached || network;
    })
  );
});
