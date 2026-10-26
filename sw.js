// Generado para la v342. Pantallas guardadas en el teléfono para abrir sin señal.
// v342: con señal débil la app ya no espera a la red para abrir: a los 3 s usa lo guardado (y lo nuevo queda listo para la próxima vez).
// Las letras de Google se guardan también, para que sin señal la app se vea igual.
const CACHE = 'aguamiel-v343', BASE = ['./', 'index.html', 'manifest.webmanifest', 'icono-192.png', 'icono-512.png'];
const FUENTES = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;
self.addEventListener('install', e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(BASE)).then(()=>self.skipWaiting())); });
self.addEventListener('activate', e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k !== CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch', e=>{
  const u = new URL(e.request.url);
  if(e.request.method !== 'GET') return;
  if(FUENTES.test(e.request.url)){
    e.respondWith(caches.match(e.request).then(r=>r || fetch(e.request).then(x=>{ if(x && (x.ok || x.type === 'opaque')){ const c = x.clone(); caches.open(CACHE).then(k=>k.put(e.request, c)); } return x; })));
    return;
  }
  if(u.origin !== self.location.origin) return;
  e.respondWith(new Promise(listo=>{
    let hecho = false;
    const dar = r=>{ if(!hecho && r){ hecho = true; listo(r); return true; } return false; };
    const guardado = ()=>caches.match(e.request, { ignoreSearch:e.request.mode === 'navigate' }).then(r=>r || (e.request.mode === 'navigate' ? caches.match('index.html') : null));
    const t = setTimeout(()=>{ guardado().then(dar); }, 3000);
    fetch(e.request).then(r=>{ if(r && r.ok){ const c = r.clone(); caches.open(CACHE).then(k=>k.put(e.request, c)); } clearTimeout(t); if(!dar(r)) return; })
      .catch(()=>{ clearTimeout(t); guardado().then(r=>{ if(!dar(r)) dar(Response.error()); }); });
  }));
});
