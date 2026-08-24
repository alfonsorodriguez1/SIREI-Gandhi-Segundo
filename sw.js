const CACHE_NAME = 'sirei-gandhi-v2';
const urlsToCache = [
  'index.html',
  'gandhi.html',
  'css/style.css',
  'js/auth.js',
  'js/app.js',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .catch(err => console.warn('SW: no se pudieron cachear todos los assets:', err))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;

  // Solo GET y dentro del propio origen de la app (estáticos).
  // Las llamadas a la API de Apps Script y a los CDN van siempre a red.
  if (req.method !== 'GET') return;
  if (!req.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(req).then(cached => {
      const refreshed = fetch(req).then(res => {
        if (res && res.status === 200 && req.url.startsWith(self.location.origin)) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || refreshed;
    })
  );
});