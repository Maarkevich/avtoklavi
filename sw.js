const CACHE_NAME = "operator-pwa-v2.0.0";
const ASSETS_TO_CACHE = [
  "./", "./index.html", "./styles.css", "./data-autoclave.js", "./data-boiler.js",
  "./data-full-1.js", "./data-full-2.js", "./full-index.js", "./loading.js", "./app.js", "./manifest.json", ...Array.from({length:146},(_,i)=>`./images/doc${i<61?'1':'2'}_${String(i<61?i:i-61).padStart(3,'0')}.${i===0?'jpeg':'png'}`)
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }
        });
    })
  );
});