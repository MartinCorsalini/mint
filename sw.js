// Cambiar este número en cada entrega: así el celular detecta que hay versión nueva.
const VERSION = 'mint-2026-10-07a';
const CACHE = VERSION;
const BASE = new URL('./', self.location).pathname;

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll([BASE, BASE + 'index.html', BASE + 'manifest.json']))
      .catch(() => null)
  );
  // No se activa solo: espera a que la app le diga "actualizar".
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'ACTUALIZAR') self.skipWaiting();
  if (e.data === 'VERSION' && e.source) e.source.postMessage({ version: VERSION });
});

// Red primero (sin caché del navegador para el HTML), caché como respaldo sin conexión.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const esPagina = req.mode === 'navigate' || url.pathname === BASE || url.pathname.endsWith('.html');
  e.respondWith(
    fetch(esPagina ? new Request(req, { cache: 'no-store' }) : req)
      .then(res => {
        const copia = res.clone();
        caches.open(CACHE).then(c => c.put(req, copia)).catch(() => null);
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match(BASE + 'index.html')))
  );
});
