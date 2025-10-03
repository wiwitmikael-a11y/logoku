// © 2024 Atharrazka Core by Rangga.P.H. All Rights Reserved.

const CACHE_NAME = 'desainfun-cache-v2';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  // Key assets from CDN
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Plus+Jakarta+Sans:wght@400;500;700;800&family=Bebas+Neue&display=swap',
  'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/Mang_AI.png',
  'https://cdn.jsdelivr.net/gh/wiwitmikael-a11y/logoku-assets@main/favicon.ico'
];

// Install the service worker and cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// Serve cached content when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
