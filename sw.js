const CACHE_NAME = "operator-pwa-v2.0.2";
const ASSETS_TO_CACHE = [
  "./", "./index.html", "./styles.css", "./data-autoclave.js", "./data-boiler.js",
  "./data-full-1.js", "./data-full-2.js", "./full-index.js", "./loading.js", "./app.js", "./manifest.json", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/maskable-512.png", ...Array.from({length:146},(_,i)=>{const n=i<82?i:i-82; const ext=(i<82? [9,10,14,18,19,20,21,22,23,24,25,28,32,33,34,35,36,37,38,39,40,41,42,43,76,77,78,81].includes(n): [0,1,9,14,15,16,17,27,30,31,32,33,34,35,36,37,38,39,40,41,42,43,48,49,50,57,58,63].includes(n)) ? "jpeg" : "png"; return `./images/doc${i<82?"1":"2"}_${String(n).padStart(3,"0")}.${ext}`})
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