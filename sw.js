const C='dt-3',A=['js/extras.js','js/library.js','js/config.js','./','index.html','css/style.css','js/app.js','js/db.js','manifest.json','icon.svg'];
self.oninstall=e=>e.waitUntil(caches.open(C).then(c=>c.addAll(A)));
self.onactivate=e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));
self.onfetch=e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;
e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(C).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request)))};
