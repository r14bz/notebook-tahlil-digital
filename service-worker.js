const CACHE_NAME = 'e-moeslife-shell-v1';
const CORE_ASSETS = [
  '/', '/index.html', '/manifest.webmanifest',
  '/src/app.js', '/src/styles/app.css',
  '/src/components/app-shell.js',
  '/src/components/shell/header.js',
  '/src/components/shell/home-page.js',
  '/src/components/shell/reader-page.js',
  '/src/components/shell/footer.js',
  '/src/services/offline/register-service-worker.js',
  '/src/services/storage/preferences.js',
  '/src/features/reader/navigation.js',
  '/src/features/reader/pagination.js',
  '/src/data/sections.js',
  '/src/data/dzikir-overrides.json',
  '/etahlil-pembagian-halaman-dzikir.json'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('e-moeslife-') && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put('/index.html', copy));
      return response;
    }).catch(() => caches.match('/index.html')));
    return;
  }
  event.respondWith(caches.match(request).then(cached => {
    if (cached) return cached;
    return fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      }
      return response;
    });
  }));
});
