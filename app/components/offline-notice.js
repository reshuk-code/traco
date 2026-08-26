'use client';

import { useSyncExternalStore } from 'react';
import { useOffline } from 'next/offline';
import ExpenseForm from './expense-form';
import ExpenseList from './expense-list';
import { useOutbox } from './use-outbox';

/**
 * Shown when the session is valid but the database cannot be reached. Logging
 * still works here — entries go to the device and sync later — which is the
 * whole point of being able to use this thing on a bad connection.
 */
function localToday() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const noSubscribe = () => () => {};

export default function OfflineNotice({ today: serverToday, currency }) {
  const isOffline = useOffline();
  const outbox = useOutbox();

  // The server could not reach the database, so it could not look up the
  // user's timezone either. The browser's own date is the better answer, and
  // reading it this way keeps server and client markup in agreement.
  const today = useSyncExternalStore(noSubscribe, localToday, () => serverToday);

  const pendingToday = outbox.filter((e) => e.spent_on === today);

  return (
    <div className="flex flex-col gap-6">
      <section
        className="rounded-2xl px-5 py-4 text-sm"
        style={{
          background: 'color-mix(in srgb, var(--warn) 12%, transparent)',
          color: 'var(--warn)',
        }}
        role="status"
      >
        <p className="font-semibold">
          {isOffline ? "You're offline" : "Can't reach your saved data"}
        </p>
        <p className="mt-1">
          Today&apos;s totals and history need a connection. You can still log
          expenses below — they save on this device and sync automatically.
        </p>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold">Log an expense</h2>
        <ExpenseForm today={today} currency={currency} />
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="text-sm font-semibold">
          Waiting to sync
          {pendingToday.length > 0 && (
            <span className="ml-2 font-normal text-muted">{pendingToday.length}</span>
          )}
        </h2>
        <ExpenseList
          expenses={[]}
          pending={pendingToday}
          currency={currency}
          emptyText="Nothing waiting. Anything you log now is kept on this device."
        />
      </section>
    </div>
  );
}
