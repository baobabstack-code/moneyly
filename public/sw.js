const CACHE_NAME = 'moneyly-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon.svg',
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline essentials');
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('Failed to pre-cache some assets:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignore non-GET requests and Supabase API/Auth calls or Next.js dev server HMR requests
  if (
    request.method !== 'GET' || 
    url.href.includes('supabase.co') || 
    url.pathname.includes('/_next/webpack-hmr') ||
    url.pathname.includes('/_next/data')
  ) {
    return;
  }

  // Cache First Strategy for Fonts, Stylesheets and Images
  if (
    request.destination === 'font' ||
    request.destination === 'image' ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.includes('/fonts/')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, cacheCopy));
          }
          return networkResponse;
        }).catch(() => {
          // If fetch fails, return undefined or cache fallback
          return null;
        });
      })
    );
    return;
  }

  // Network First Strategy for HTML documents and Next JS Scripts
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cacheCopy));
        }
        return networkResponse;
      })
      .catch(() => {
        console.log('[Service Worker] Offline fallback for:', request.url);
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If the request is for a document navigation, fallback to index
          if (request.mode === 'navigate') {
            return caches.match('/');
          }
          return null;
        });
      })
  );
});
