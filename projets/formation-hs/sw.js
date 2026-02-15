/**
 * Service Worker — Formation Hygiène & Salubrité
 * Cache-first pour les assets, network-first pour les pages
 */
const CACHE_NAME = 'formation-hs-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './config.json',
  './css/common.css',
  './css/support.css',
  './css/formation.css',
  './css/print.css',
  './css/presentation.css',
  './js/config-loader.js',
  './js/navigation.js',
  './js/quiz-engine.js',
  './js/progress-tracker.js',
  './js/case-studies.js',
  './js/print-handler.js',
  './js/pwa-register.js',
  './js/presentation.js',
  './data/quizzes.json',
  './data/memo-sheets.json',
  './assets/icon.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './modules/index.html',
  './modules/module-1.html',
  './modules/module-2.html',
  './modules/module-3.html',
  './modules/module-4.html',
  './modules/module-5.html',
  './modules/module-6.html',
  './modules/module-7.html',
  './modules/module-8.html',
  './modules/module-9.html',
  './support/index.html',
  './support/presentation.html',
  './support/unite-1.html',
  './support/unite-2.html',
  './support/unite-3.html',
  './support/unite-4.html',
  './support/unite-5.html',
  './support/unite-6.html',
  './support/unite-7.html',
  './support/unite-8.html',
  './support/unite-9.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request) || caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      });
    })
  );
});
