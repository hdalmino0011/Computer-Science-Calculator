const CACHE_NAME = 'cs-calc-v2';
const ASSETS = [
  'index.html',
  'styles.css',
  'script.js',
  'manifest.json',
  'icon-192.png',
  'icon-512.png'
];

// Install event - cache all assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching assets...');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache first, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached response if found
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Otherwise fetch from network
        return fetch(event.request)
          .then((networkResponse) => {
            // Cache the new response for future offline use
            return caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, networkResponse.clone());
                return networkResponse;
              });
          })
          .catch(() => {
            // If both cache and network fail, show offline page
            // For HTML requests, return the cached index.html
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('index.html');
            }
            // For other resources, return a simple offline response
            return new Response('Offline - Please connect to the internet', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});
