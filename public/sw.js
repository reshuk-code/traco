/* traco service worker — makes the app open with no network at all. */

const VERSION = 'traco-v2';
const SHELL = `${VERSION}-shell`;
const PAGES = `${VERSION}-pages`;
const ASSETS = `${VERSION}-assets`;

const PRECACHE = [
  '/offline',
  '/download',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/** Sign-out asks us to drop everything cached for this account. */
self.addEventListener('message', (event) => {
  if (event.data?.type === 'clear-cache') {
    event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))));
  }
});

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never touch anything but same-origin reads. Auth and Server Actions must
  // always go to the network so they can be retried, never served from cache.
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Immutable build output: production asset URLs are content-hashed, so
  // cache-first is safe here. (Dev never registers this worker — see pwa.js.)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, ASSETS));
    return;
  }

  // Page loads and the RSC payloads that soft navigation uses.
  const isNavigation = request.mode === 'navigate';
  const isRsc = url.searchParams.has('_rsc') || request.headers.has('RSC');

  if (isNavigation || isRsc) {
    event.respondWith(
      networkFirst(request, PAGES).catch(async () => {
        const shell = await caches.open(SHELL);
        return (
          (await shell.match('/offline')) ??
          new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } })
        );
      }),
    );
    return;
  }

  // Icons, fonts, and anything else static we serve ourselves.
  event.respondWith(
    cacheFirst(request, ASSETS).catch(
      () => new Response('', { status: 504 }),
    ),
  );
});
