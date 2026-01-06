// Service Worker for SONIC IRAQ POS System
// Update CACHE_VERSION when you deploy new files to force cache refresh
const CACHE_VERSION = 'v2.0';
const CACHE_NAME = 'sonic-pos-' + CACHE_VERSION;
const urlsToCache = [
  '/',
  '/index.html',
  '/home.html',
  '/sale.html',
  '/login.js',
  '/script.js',
  '/shared.js',
  '/styles.css',
  '/sonic logo.png',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// Install event - cache resources
self.addEventListener('install', function(event) {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Service Worker: Opened cache', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .then(function() {
        // Force activation of new service worker
        return self.skipWaiting();
      })
  );
});

// Fetch event - Network first, then cache (for updates)
self.addEventListener('fetch', function(event) {
  // Skip caching for API calls
  if (event.request.url.includes('/api/')) {
    return fetch(event.request);
  }
  
  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // If network request succeeds, update cache
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(function() {
        // If network fails, try cache
        return caches.match(event.request)
          .then(function(response) {
            if (response) {
              return response;
            }
            // Return offline page if available
            return caches.match('/index.html');
          });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(function() {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});
