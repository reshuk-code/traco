'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker that lets the app open with no network, and that
 * receives the daily reminder push.
 *
 * It is registered in development too, which it did not used to be. The reason
 * it was skipped was caching: Turbopack serves assets from stable URLs whose
 * contents change on every edit, so a cache-first worker pins the first
 * stylesheet it ever saw. That problem is now handled inside the worker, which
 * does not intercept fetches on localhost at all — so dev gets working push
 * without getting stale assets.
 */
export default function Pwa() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    (async () => {
      // Clear out anything an older cache-first worker left behind on this
      // machine, so a dev box that ran the previous version starts clean.
      if (process.env.NODE_ENV !== 'production' && 'caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }

      // The flag tells the worker to skip caching. It rides on the script URL
      // so it reflects the build, not the hostname.
      const url =
        process.env.NODE_ENV === 'production' ? '/sw.js' : '/sw.js?dev=1';

      await navigator.serviceWorker.register(url, {
        scope: '/',
        updateViaCache: 'none',
      });
    })().catch(() => {
      // No service worker means no offline shell and no reminders; the app
      // still works online.
    });
  }, []);

  return null;
}
