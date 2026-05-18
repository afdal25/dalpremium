const STATIC_CACHE = "dalpremium-static-v1";
const RUNTIME_CACHE = "dalpremium-runtime-v1";
const PUBLIC_API_PATHS = new Set([
  "/api/shop",
  "/api/articles",
  "/api/content",
  "/api/product-categories",
]);

const isStaticAsset = (url) =>
  url.origin === self.location.origin &&
  (url.pathname.startsWith("/assets/") ||
    url.pathname === "/favicon.png" ||
    url.pathname === "/robots.txt" ||
    url.pathname === "/sitemap.xml");

const isPublicApi = (url) =>
  url.hostname === "dalpremium-backend.onrender.com" &&
  PUBLIC_API_PATHS.has(url.pathname);

const cacheFirst = async (request) => {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  const response = await fetch(request);

  if (response.ok || response.type === "opaque") {
    cache.put(request, response.clone());
  }

  return response;
};

const staleWhileRevalidate = async (request) => {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok || response.type === "opaque") {
        cache.put(request, response.clone());
      }

      return response;
    })
    .catch(() => cached);

  return cached || network;
};

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                ![STATIC_CACHE, RUNTIME_CACHE].includes(key)
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);

  if (isStaticAsset(url) || url.hostname === "res.cloudinary.com") {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  if (isPublicApi(url)) {
    event.respondWith(staleWhileRevalidate(event.request));
  }
});
