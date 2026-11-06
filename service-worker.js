const CACHE_NAME = 'e-moeslife-shell-v14';
const CORE_ASSETS = [
  '/', '/index.html', '/manifest.webmanifest',
  '/src/app.js', '/src/styles/app.css',
  '/src/services/app-update.js',
  '/src/features/library/equran-library.js',
  '/src/features/library/local-kitab-library.js',
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
  '/assets/mosque-banner.png',
  '/assets/app-icon/icon.png',
  '/src/data/dzikir-overrides.json',
  '/etahlil-pembagian-halaman-dzikir.json',
  '/data/safinah-an-najah.json', '/data/aqidatul-awam.json'
];

// Naskah dan file layout sering diperbarui pemilik proyek: selalu coba jaringan lebih dulu,
// lalu pakai salinan cache bila offline atau jaringan terlalu lambat.
const NETWORK_FIRST_TIMEOUT_MS = 4000;
const NETWORK_FIRST_PATHS = ['/etahlil-pembagian-halaman-dzikir.json', '/src/data/dzikir-overrides.json'];
const isNetworkFirst = url => url.pathname.startsWith('/data/') || NETWORK_FIRST_PATHS.includes(url.pathname);

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const network = fetch(request, { cache: 'no-cache' }).then(response => {
    if (response.ok) cache.put(request, response.clone()).catch(() => {});
    return response;
  });
  if (!cached) return network;
  try {
    return await Promise.race([
      network,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), NETWORK_FIRST_TIMEOUT_MS))
    ]);
  } catch {
    network.catch(() => {});
    return cached;
  }
}

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
  if (isNetworkFirst(new URL(request.url))) {
    event.respondWith(networkFirst(request));
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
