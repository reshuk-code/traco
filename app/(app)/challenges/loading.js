'use client';

import { useOffline } from 'next/offline';
import Spinner from '@/app/components/spinner';

export default function Loading() {
  const isOffline = useOffline();

  // A fixed viewport-relative height, because this box's parent is not a flex
  // container — `flex-1` here would collapse it to its content and sit at the top.
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 text-brand">
      <Spinner size={30} />
      {isOffline && <p className="text-sm text-muted">Waiting for a connection…</p>}
    </div>
  );
}
