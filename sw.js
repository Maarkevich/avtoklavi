const CACHE='avtoklavi-v3';
const CORE=['./','./index.html','./styles.css','./app.js','./manifest.webmanifest','./icons/icon.svg','./data/source-content.json'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(async c=>{for(const url of CORE){try{await c.add(url)}catch(err){}};return self.skipWaiting()})));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(r=>{if(r.ok)caches.open(CACHE).then(c=>c.put(e.request,r.clone()));return r}).catch(()=>caches.match('./index.html'))))});
