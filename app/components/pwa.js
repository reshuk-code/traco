'use client';

import { useEffect } from 'react';

/** Registers the service worker that lets the app open with no network. */
export default function Pwa() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .catch(() => {
        // No service worker means no offline shell; the app still works online.
      });
  }, []);

  return null;
}
