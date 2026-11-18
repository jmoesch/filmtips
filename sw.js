const prefix="filmtips-"+self.registration.scope+"-";
const version=prefix+"2.1.4";
const files=["./index.html","./app.js","./app.css","./manifest.webmanifest","./apple-touch-icon.png","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>e.waitUntil(caches.open(version).then(c=>c.addAll(files.map(f=>new Request(f,{cache:"reload"}))))));
self.addEventListener("activate",e=>e.waitUntil((async()=>{
  for(const k of await caches.keys())if(k.startsWith(prefix)&&k!==version)await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET"||!e.request.url.startsWith(self.registration.scope))return;
  e.respondWith((async()=>{
    const cache=await caches.open(version);
    return await cache.match(e.request.mode==="navigate"?"./index.html":e.request)||fetch(e.request);
  })());
});
