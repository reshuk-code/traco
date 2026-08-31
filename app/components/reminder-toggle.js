'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  savePushSubscription,
  updateReminderHour,
  disablePushReminders,
} from '@/app/actions/push';
import {
  pushSupported,
  subscribeToPush,
  unsubscribeFromPush,
  currentSubscription,
  notificationPermission,
} from '@/lib/push';
import Spinner from './spinner';

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 06:00 through 23:00

const REASONS = {
  unsupported: 'This browser cannot do push notifications.',
  'no-key': 'Push is not configured on the server yet (no VAPID key).',
  denied: 'Notifications were not allowed, so nothing was turned on.',
  'no-service-worker':
    'No service worker is running yet. Reload the page once and try again.',
  failed: 'The browser refused the subscription. Check the VAPID key.',
};

function hourLabel(h) {
  const suffix = h < 12 ? 'am' : 'pm';
  const twelve = h % 12 === 0 ? 12 : h % 12;
  return `${twelve}:00 ${suffix}`;
}

/**
 * The daily reminder.
 *
 * Two separate things have to be true for this to be "on": the account has an
 * hour set, and *this device* has a push subscription. They are tracked apart
 * because a phone and a laptop are two devices — turning it off here only
 * unsubscribes the one you are holding.
 */
export default function ReminderToggle({ reminderHour, publicKey, timezone }) {
  const [supported, setSupported] = useState(null);
  const [subscribed, setSubscribed] = useState(false);
  const [permission, setPermission] = useState('default');
  const [hour, setHour] = useState(reminderHour ?? 20);
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!pushSupported() || !publicKey) {
        if (!cancelled) setSupported(false);
        return;
      }
      setSupported(true);
      setPermission(notificationPermission());
      const existing = await currentSubscription();
      if (!cancelled) setSubscribed(Boolean(existing));
    })();

    return () => {
      cancelled = true;
    };
  }, [publicKey]);

  function turnOn() {
    setError(null);
    startTransition(async () => {
      const attempt = await subscribeToPush(publicKey);
      setPermission(notificationPermission());

      if (!attempt.ok) {
        setError(REASONS[attempt.reason] ?? 'Could not turn reminders on.');
        return;
      }
      const result = await savePushSubscription(attempt.subscription, hour);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSubscribed(true);
    });
  }

  function turnOff() {
    setError(null);
    startTransition(async () => {
      const endpoint = await unsubscribeFromPush();
      await disablePushReminders(endpoint);
      setSubscribed(false);
    });
  }

  function changeHour(next) {
    setHour(next);
    if (!subscribed) return;
    startTransition(async () => {
      const result = await updateReminderHour(next);
      if (result?.error) setError(result.error);
    });
  }

  const on = subscribed && reminderHour !== null;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px] leading-relaxed text-muted">
            A notification once a day with what&apos;s left and how your challenge is
            going — so you don&apos;t have to open the app to find out.
          </p>
        </div>
        {isPending && <Spinner size={18} label="Working" />}
      </div>

      {supported === false && (
        <p className="mt-3 text-[13px] text-muted">
          This browser can&apos;t do notifications. On iPhone they only work once
          traco is added to the Home Screen.
        </p>
      )}

      {supported && permission === 'denied' && (
        <p className="mt-3 text-[13px]" style={{ color: 'var(--warn)' }}>
          Notifications are blocked for this site. You&apos;ll need to allow them in
          your browser settings before this can be switched on.
        </p>
      )}

      {supported && permission !== 'denied' && (
        <>
          <div className="mt-3.5 flex items-center justify-between gap-3 rounded-inner bg-surface-2 px-3.5 py-3">
            <label className="text-[13px] text-muted" htmlFor="reminder_hour">
              Send it at
            </label>
            <select
              id="reminder_hour"
              value={hour}
              disabled={isPending}
              onChange={(e) => changeHour(Number(e.target.value))}
              className="cursor-pointer bg-transparent text-[15px] font-semibold outline-none focus:text-brand"
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {hourLabel(h)}
                </option>
              ))}
            </select>
          </div>

          <p className="mt-2 text-xs leading-relaxed text-muted">
            {/* The saved timezone, not the browser's: it is the one the sender
                actually schedules against. */}
            Sent at that hour in your saved timezone ({timezone}), and only to
            this device.
          </p>

          <button
            type="button"
            onClick={on ? turnOff : turnOn}
            disabled={isPending}
            className={`mt-3.5 w-full !py-3 ${on ? 'btn btn-ghost' : 'btn btn-primary'}`}
          >
            {on ? 'Turn off on this device' : 'Turn on reminders'}
          </button>
        </>
      )}

      {error && (
        <p className="mt-3 text-sm text-over" role="alert">
          {error}
        </p>
      )}
      {on && !error && (
        <p className="mt-2.5 text-center text-xs" style={{ color: 'var(--good)' }}>
          On — next reminder at {hourLabel(hour)}.
        </p>
      )}
    </div>
  );
}
