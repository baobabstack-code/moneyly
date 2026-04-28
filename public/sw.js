// Basic service worker - disabled for now
// The app doesn't need offline caching for loan applications

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.clients.claim();
});

// Don't intercept fetches - let app work normally
self.addEventListener('fetch', () => {});