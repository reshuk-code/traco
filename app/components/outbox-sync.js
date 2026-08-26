'use client';

import { useEffect, useRef } from 'react';
import { useOffline } from 'next/offline';
import { syncExpenses } from '@/app/actions/expenses';
import { removeFromOutbox } from '@/lib/outbox';
import { useOutbox } from './use-outbox';

/**
 * Watches the outbox and flushes it whenever the app has a connection. Mounted
 * once in the app layout, so it runs on every screen.
 */
export default function OutboxSync() {
  const isOffline = useOffline();
  const outbox = useOutbox();
  const running = useRef(false);

  useEffect(() => {
    if (isOffline || outbox.length === 0 || running.current) return;

    running.current = true;
    let cancelled = false;

    (async () => {
      try {
        const { accepted, rejected } = await syncExpenses(outbox);
        if (!cancelled) removeFromOutbox([...accepted, ...rejected]);
      } catch {
        // Still unreachable. The next connectivity change re-runs this effect.
      } finally {
        running.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOffline, outbox]);

  return null;
}
