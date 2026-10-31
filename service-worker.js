const CACHE_NAME = 'e-moeslife-shell-v4';
const CORE_ASSETS = [
  '/', '/index.html', '/manifest.webmanifest',
  '/src/app.js', '/src/styles/app.css',
  '/src/features/prayer/prayer-times.js',
  '/src/components/app-shell.js',
  '/src/components/shell/header.js',
  '/src/components/shell/home-page.js',
  '/src/components/shell/reader-page.js',
  '/src/components/shell/footer.js',
  '/src/services/offline/register-service-worker.js',
  '/src/services/storage/preferences.js',
  '/src/features/reader/navigation.js',
  '/src/features/reader/page-state.js',
  '/src/features/reader/sections.js',
  '/src/features/reader/contents.js',
  '/src/features/reader/controller.js',
  '/src/features/reader/audio.js',
  '/src/features/reader/content-loader.js',
  '/src/features/reader/gestures.js',
  '/src/features/reader/appearance.js',
  '/src/features/home/search.js',
  '/src/features/home/reading-list.js',
  '/src/features/collections/navigation.js',
  '/src/features/reader/pagination.js',
  '/src/data/sections.js',
  '/src/data/dzikir.js',
  '/src/data/yasin.js',
  '/src/data/rahman.js',
  '/assets/logo-mark.webp',
  '/assets/logo-text.webp',
  '/assets/collection-icon.webp',
  '/assets/app-icon/icon.png',
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
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          try {
            const cache = await caches.open(CACHE_NAME);
            await cache.put('/index.html', response.clone());
          } catch {
            // A cache write failure must not block a successful navigation.
          }
        }
        return response;
      } catch {
        return (await caches.match('/index.html')) || Response.error();
      }
    })());
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
