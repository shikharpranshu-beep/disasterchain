/**
 * DISASTERCHAIN PRODUCTION SERVICE WORKER (PWA)
 * 
 * Safety Rules:
 * 1. Network-first for all operational disaster data.
 * 2. Never cache or auto-replay mutating distress requests (POST /api/sos).
 * 3. Tag cached emergency responses with 'x-disasterchain-cached: true'.
 * 4. Cache application shell & static bundles for offline interface resilience.
 */

const SHELL_CACHE_VERSION = 'disasterchain-shell-v1.0.0';
const API_CACHE_VERSION = 'disasterchain-api-v1.0.0';

// Core Application Shell assets to precache
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
  '/icon.svg',
  '/favicon.png',
];

// Operational read-only API path prefixes that are safe for network-first caching
const OPERATIONAL_API_ROUTES = [
  '/api/sos',
  '/api/incidents',
  '/api/shelters',
  '/api/alerts',
  '/api/resources',
  '/api/donations',
  '/api/distributions',
  '/api/intelligence',
  '/api/weather',
  '/api/preparedness',
  '/api/blockchain',
  '/api/affected-areas'
];

self.addEventListener('install', (event) => {
  // Pre-cache essential app shell assets for instant standalone launch
  event.waitUntil(
    caches.open(SHELL_CACHE_VERSION).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache incomplete (will cache on-demand):', err);
      });
    })
  );
  // Do not automatically force-activate; wait for user confirmation via PWA update toast
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== SHELL_CACHE_VERSION && cacheName !== API_CACHE_VERSION) {
            console.log('[SW] Purging deprecated cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // CRITICAL EMERGENCY SAFETY: NEVER intercept or cache POST/PUT/DELETE requests.
  // Specifically POST /api/sos MUST pass directly to network without service worker retention.
  if (request.method !== 'GET') {
    return;
  }

  // Handle HTML Navigation requests (Single Page App routing offline support)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(SHELL_CACHE_VERSION);
        const cachedShell = await cache.match('/index.html') || await cache.match('/');
        if (cachedShell) {
          return cachedShell;
        }
        return new Response(
          '<!DOCTYPE html><html><body style="background:#120B08;color:#fff;font-family:sans-serif;padding:2rem;text-align:center;">' +
          '<h2 style="color:#FF6B2C">DISASTERCHAIN — OFFLINE</h2>' +
          '<p>Operational network connection unavailable. Please reconnect or dial Emergency Services directly: 112.</p>' +
          '</body></html>',
          { headers: { 'Content-Type': 'text/html' } }
        );
      })
    );
    return;
  }

  // Handle Operational GET API requests (Network-First Strategy)
  const isApiRoute = OPERATIONAL_API_ROUTES.some((route) => url.pathname.startsWith(route));
  if (isApiRoute) {
    event.respondWith(
      fetch(request)
        .then(async (networkResponse) => {
          // Only cache valid OK responses
          if (networkResponse && networkResponse.status === 200) {
            const clonedResponse = networkResponse.clone();
            caches.open(API_CACHE_VERSION).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Network failed: attempt to retrieve cached emergency data
          const cache = await caches.open(API_CACHE_VERSION);
          const cachedResponse = await cache.match(request);
          if (cachedResponse) {
            // Reconstruct response with 'x-disasterchain-cached: true' header
            const cachedHeaders = new Headers(cachedResponse.headers);
            cachedHeaders.set('x-disasterchain-cached', 'true');
            cachedHeaders.set('x-disasterchain-offline', 'true');

            return new Response(cachedResponse.body, {
              status: cachedResponse.status,
              statusText: cachedResponse.statusText,
              headers: cachedHeaders,
            });
          }

          // No cache available: return safe structured offline response
          return new Response(
            JSON.stringify({
              success: false,
              offline: true,
              message: 'DisasterChain Offline: Live operational network unavailable and no cached records exist.',
              data: [],
            }),
            {
              status: 503,
              headers: {
                'Content-Type': 'application/json',
                'x-disasterchain-cached': 'false',
                'x-disasterchain-offline': 'true',
              },
            }
          );
        })
    );
    return;
  }

  // Static Assets (JS, CSS, Fonts, Images, Leaflet tiles, etc.)
  // Stale-While-Revalidate or Cache-First with network refresh
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cloned = networkResponse.clone();
            caches.open(SHELL_CACHE_VERSION).then((cache) => {
              cache.put(request, cloned);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
