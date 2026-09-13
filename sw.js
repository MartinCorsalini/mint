const CACHE = 'deptosadm-v1';
const BASE = new URL('./', self.location).pathname;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll([BASE, BASE + 'index.html', BASE + 'manifest.json'])).catch(() => null));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

// La app necesita datos frescos: red primero, caché como respaldo sin conexión.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then(res => {
      const copia = res.clone();
      caches.open(CACHE).then(c => c.put(req, copia)).catch(() => null);
      return res;
    }).catch(() => caches.match(req).then(hit => hit || caches.match(BASE + 'index.html')))
  );
});
