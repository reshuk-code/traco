'use client';

import { useOffline } from 'next/offline';

export default function Loading() {
  const isOffline = useOffline();

  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="h-8 w-40 animate-pulse rounded-lg bg-surface-2" />
      <div className="card h-40 animate-pulse" />
      <div className="card h-56 animate-pulse" />
      <p className="text-center text-sm text-muted">
        {isOffline ? 'Waiting for a connection…' : 'Loading…'}
      </p>
    </div>
  );
}
