// Funziona senza internet: prova la rete, e se manca usa la copia salvata.
const CACHE='suonolandia-v2';
const FILES=['./','index.html','style.css','manifest.json','icon.svg',
  'js/main.js','js/core.js','js/store.js','js/audio.js','js/seq.js','js/grid.js','js/keys.js','js/voice.js','js/midi.js','js/shelf.js','js/parent.js','js/fun.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;
  e.respondWith(
    fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r})
      .catch(()=>caches.match(e.request,{ignoreSearch:true}))
  );
});
