const VERSION = "3.2.0";
const CACHE_CORE = "avtoklavi-core-v" + VERSION;
const CACHE_MEDIA = "avtoklavi-media-v1";

// Кэшируем при установке ТОЛЬКО ядро. Изображения (65 МБ) кэшируются
// лениво при первом открытии — иначе install падает по таймауту на телефоне.
const CORE = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./loading.js",
  "./data-autoclave.js",
  "./data-boiler.js",
  "./data-enriched.js",
  "./unified-manual.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_CORE).then((cache) => cache.addAll(CORE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_CORE && k !== CACHE_MEDIA)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== location.origin) return;

  // Изображения: сначала кэш, потом сеть с сохранением в media-кэш
  if (url.pathname.includes("/images/")) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((resp) => {
          if (resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE_MEDIA).then((c) => c.put(event.request, clone));
          }
          return resp;
        });
      })
    );
    return;
  }

  // Ядро (HTML/JS/CSS/manifest): сначала сеть, при оффлайне — кэш
  event.respondWith(
    fetch(event.request)
      .then((resp) => {
        if (resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE_CORE).then((c) => c.put(event.request, clone));
        }
        return resp;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === "navigate") return caches.match("./index.html");
        })
      )
  );
});
