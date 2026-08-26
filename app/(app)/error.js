'use client';

import { useOffline } from 'next/offline';

export default function AppError({ error, reset }) {
  const isOffline = useOffline();

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm text-center">
        <p className="text-4xl">{isOffline ? '📴' : '⚠️'}</p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          {isOffline ? "You're offline" : "Couldn't load this page"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {isOffline
            ? 'Anything you logged while offline is stored on this device and will sync once you reconnect.'
            : 'We could not reach your data just now. Nothing you logged has been lost.'}
        </p>
        <button type="button" onClick={reset} className="btn btn-primary mt-5">
          Try again
        </button>
      </div>
    </div>
  );
}
