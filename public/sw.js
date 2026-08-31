/* traco service worker — makes the app open with no network at all. */

const VERSION = 'traco-v4';

// In development this worker exists purely to receive push, and must not touch
// caching: Turbopack serves assets from stable URLs whose contents change on
// every edit, so a cache-first worker would pin the first stylesheet it ever saw.
//
// Keyed on how it was registered, not on the hostname — a production build run
// locally with `npm start` is still on localhost, and offline testing there has
// to keep working.
const IS_DEV = new URL(self.location.href).searchParams.get('dev') === '1';
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
  if (IS_DEV) {
    event.waitUntil(self.skipWaiting());
    return;
  }

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
  // Dev: stay out of the way entirely. Push handlers below still run.
  if (IS_DEV) return;

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

/**
 * The daily reminder. This is the only part of traco that reaches the user
 * without the app being opened, so it has to say something worth reading on a
 * lock screen: what is left today, and how the challenge is going.
 */
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    // A malformed push should still show something rather than nothing.
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'traco', {
      body: payload.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      // One reminder per day replaces the last, rather than stacking up.
      tag: payload.tag || 'traco-daily',
      renotify: true,
      data: { url: payload.url || '/dashboard' },
      actions: [{ action: 'log', title: 'Log an expense' }],
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const target =
    event.action === 'log' ? '/dashboard?log=1' : event.notification.data?.url || '/dashboard';

  // Reuse an open traco tab if there is one; only open a window as a last resort.
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      for (const client of clients) {
        if (new URL(client.url).origin === self.location.origin) {
          await client.focus();
          return client.navigate(target);
        }
      }
      return self.clients.openWindow(target);
    })(),
  );
});
