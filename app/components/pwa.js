'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker that lets the app open with no network.
 *
 * Production only, deliberately. In development Turbopack serves assets from
 * stable URLs whose contents change on every edit, so a cache-first worker
 * pins the first stylesheet it ever saw and every later change is invisible in
 * the browser. In dev we tear the worker down instead of installing one.
 */
export default function Pwa() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .then(async () => {
          if (!('caches' in window)) return;
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        })
        .catch(() => {
          // Nothing to clean up, or the browser refused — harmless either way.
        });
      return;
    }

    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .catch(() => {
        // No service worker means no offline shell; the app still works online.
      });
  }, []);

  return null;
}
