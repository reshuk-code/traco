'use client';

import { useOffline } from 'next/offline';
import { useOutbox } from './use-outbox';

export default function OfflineBanner() {
  const isOffline = useOffline();
  const outbox = useOutbox();

  if (!isOffline && outbox.length === 0) return null;

  const waiting = outbox.length;

  return (
    <div
      role="status"
      className="px-4 py-2 text-center text-sm font-medium"
      style={{
        background: isOffline
          ? 'color-mix(in srgb, var(--warn) 18%, transparent)'
          : 'color-mix(in srgb, var(--brand) 18%, transparent)',
        color: isOffline ? 'var(--warn)' : 'var(--brand)',
      }}
    >
      {isOffline ? 'Offline — you can keep logging, it saves on this device.' : 'Back online — syncing…'}
      {waiting > 0 && ` (${waiting} waiting to sync)`}
    </div>
  );
}
