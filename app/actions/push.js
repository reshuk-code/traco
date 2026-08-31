'use server';

import { refresh } from 'next/cache';
import { sql } from '@/lib/db';
import { requireUser } from '@/lib/data';

/** Push endpoints are https URLs issued by the browser's own push service. */
function validSubscription(sub) {
  return (
    sub &&
    typeof sub.endpoint === 'string' &&
    sub.endpoint.startsWith('https://') &&
    sub.endpoint.length <= 2000 &&
    typeof sub.keys?.p256dh === 'string' &&
    typeof sub.keys?.auth === 'string'
  );
}

/**
 * Registers this device and switches the daily reminder on.
 *
 * Keyed on the endpoint, so re-subscribing the same device updates its keys
 * instead of creating a second row that would double up the notification.
 */
export async function savePushSubscription(subscription, hour) {
  const user = await requireUser();

  if (!validSubscription(subscription)) {
    return { error: 'This browser gave us an unusable subscription.' };
  }

  const reminderHour = Number(hour);
  if (!Number.isInteger(reminderHour) || reminderHour < 0 || reminderHour > 23) {
    return { error: 'Pick an hour between 0 and 23.' };
  }

  await sql`
    insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
    values (${user.id}, ${subscription.endpoint}, ${subscription.keys.p256dh}, ${subscription.keys.auth})
    on conflict (endpoint) do update
      set user_id = excluded.user_id,
          p256dh  = excluded.p256dh,
          auth    = excluded.auth,
          -- A fresh subscribe should be eligible again today.
          last_sent_on = null
  `;

  await sql`
    update public.user_settings
    set reminder_hour = ${reminderHour}, updated_at = now()
    where user_id = ${user.id}
  `;

  refresh();
  return { ok: true, error: null };
}

/** Just the hour, for someone who is already subscribed. */
export async function updateReminderHour(hour) {
  const user = await requireUser();

  const reminderHour = Number(hour);
  if (!Number.isInteger(reminderHour) || reminderHour < 0 || reminderHour > 23) {
    return { error: 'Pick an hour between 0 and 23.' };
  }

  await sql`
    update public.user_settings
    set reminder_hour = ${reminderHour}, updated_at = now()
    where user_id = ${user.id}
  `;

  refresh();
  return { ok: true, error: null };
}

/**
 * Switches reminders off. The endpoint is dropped so this device stops being
 * sent to; the hour is only cleared once no device is listening any more.
 */
export async function disablePushReminders(endpoint) {
  const user = await requireUser();

  if (typeof endpoint === 'string' && endpoint.startsWith('https://')) {
    await sql`
      delete from public.push_subscriptions
      where user_id = ${user.id} and endpoint = ${endpoint}
    `;
  }

  const remaining = await sql`
    select count(*)::int as n from public.push_subscriptions where user_id = ${user.id}
  `;
  if (remaining[0].n === 0) {
    await sql`
      update public.user_settings
      set reminder_hour = null, updated_at = now()
      where user_id = ${user.id}
    `;
  }

  refresh();
  return { ok: true, error: null };
}
