// Cambiar este número en cada entrega: así el celular detecta que hay versión nueva.
const VERSION = 'mint-2026-10-07b';
const CACHE = VERSION;
const BASE = new URL('./', self.location).pathname;

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll([BASE, BASE + 'index.html', BASE + 'manifest.json']))
      .catch(() => null)
  );
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

// Notificaciones
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Mint', {
    body: d.body || '',
    icon: BASE + 'icon-192.png',
    badge: BASE + 'icon-192.png',
    tag: d.tag || 'mint-avisos',
    renotify: true,
    data: { url: d.url || BASE }
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const destino = (e.notification.data && e.notification.data.url) || BASE;
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
      for (const c of cs) { if ('focus' in c) return c.focus(); }
      return self.clients.openWindow(destino);
    })
  );
});
