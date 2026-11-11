// Generado para la v381. Pantallas guardadas en el teléfono para abrir sin señal.
// v342: con señal débil la app ya no espera a la red para abrir: a los 3 s usa lo guardado (y lo nuevo queda listo para la próxima vez).
// v344: al instalar una versión nueva y al pedir las pantallas se salta la copia del navegador (antes podía guardar la versión anterior hasta 10 min).
// Las letras de Google se guardan también, para que sin señal la app se vea igual.
const CACHE = 'aguamiel-v381', BASE = ['./', 'index.html', 'manifest.webmanifest', 'icono-192.png', 'icono-512.png'];
const FUENTES = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;
self.addEventListener('install', e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(BASE.map(u=>new Request(u, { cache:'reload' })))).then(()=>self.skipWaiting())); });
self.addEventListener('activate', e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k !== CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch', e=>{
  const u = new URL(e.request.url);
  if(e.request.method !== 'GET') return;
  if(FUENTES.test(e.request.url)){
    e.respondWith(caches.match(e.request).then(r=>r || fetch(e.request).then(x=>{ if(x && (x.ok || x.type === 'opaque')){ const c = x.clone(); caches.open(CACHE).then(k=>k.put(e.request, c)); } return x; })));
    return;
  }
  if(u.origin !== self.location.origin) return;
  const nav = e.request.mode === 'navigate';
  e.respondWith(new Promise(listo=>{
    let hecho = false;
    const dar = r=>{ if(!hecho && r){ hecho = true; listo(r); return true; } return false; };
    const guardado = ()=>caches.match(e.request, { ignoreSearch:nav }).then(r=>r || (nav ? caches.match('index.html') : null));
    const t = setTimeout(()=>{ guardado().then(dar); }, 3000);
    fetch(nav ? new Request(e.request.url, { cache:'no-cache', credentials:'same-origin' }) : e.request).then(r=>{ if(r && r.ok){ const c = r.clone(); caches.open(CACHE).then(k=>k.put(e.request, c)); } clearTimeout(t); if(!dar(r)) return; })
      .catch(()=>{ clearTimeout(t); guardado().then(r=>{ if(!dar(r)) dar(Response.error()); }); });
  }));
});

// 🔔 v368: avisos al teléfono. El aviso llega vacío; aquí se le pregunta al servidor qué dice (con la dirección secreta de este teléfono)
// y se muestra con el numerito en el ícono. Si no hay señal o el servidor tarda, sale un aviso general para no perderlo.
const API = 'https://script.google.com/macros/s/AKfycbyvzuGSC4rECcef_3-kZkhHm3rZdtuBx52qr-ZfBZwtpoJP1WwJOdFbfKpyV3_gULNB/exec';
const ICONO = 'icono-192.png';
self.addEventListener('push', e=>{
  e.waitUntil((async ()=>{
    let d = null;
    try{
      const sub = await self.registration.pushManager.getSubscription();
      const ctl = new AbortController(); setTimeout(()=>ctl.abort(), 20000);
      const r = await fetch(API, { method:'POST', body:JSON.stringify({ fn:'pushPendiente', args:[sub ? sub.endpoint : ''] }), signal:ctl.signal });
      const j = await r.json(); if(j && j.ok) d = j.r;
    }catch(err){}
    const n = d ? Number(d.n) || 0 : 0;
    try{ if(self.navigator.setAppBadge){ if(n > 0) await self.navigator.setAppBadge(n); else if(d) await self.navigator.clearAppBadge(); } }catch(err){}
    const nuevos = d && Array.isArray(d.nuevos) ? d.nuevos : [];
    if(!nuevos.length){
      return self.registration.showNotification('Aguamiel', { body:n > 1 ? 'Tienes ' + n + ' avisos sin ver.' : 'Tienes un aviso nuevo.', icon:ICONO, badge:ICONO, tag:'ag-resumen', data:{ tipo:'' } });
    }
    for(const a of nuevos.slice().reverse()){
      await self.registration.showNotification(a.titulo || 'Aguamiel', { body:a.cuerpo || '', icon:ICONO, badge:ICONO, tag:'ag-' + a.id, data:{ tipo:a.tipo || '' } });
    }
  })());
});
self.addEventListener('notificationclick', e=>{
  e.notification.close();
  const tipo = (e.notification.data && e.notification.data.tipo) || '';
  e.waitUntil((async ()=>{
    const ventanas = await self.clients.matchAll({ type:'window', includeUncontrolled:true });
    for(const c of ventanas){ if(c.url.indexOf(self.registration.scope) === 0 && 'focus' in c){ await c.focus(); c.postMessage({ agAviso:tipo || 'abrir' }); return; } }
    return self.clients.openWindow('./' + (tipo ? '#aviso=' + tipo : ''));
  })());
});
