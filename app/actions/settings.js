'use server';

import { refresh } from 'next/cache';
import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';
import { requireUser, getSettings, getToday } from '@/lib/data';
import { parseAmountToCents, CURRENCIES } from '@/lib/money';
import { isValidTimezone } from '@/lib/timezone';

export async function updateSettings(_prevState, formData) {
  const user = await requireUser();
  const current = await getSettings(user.id);

  const name = String(formData.get('name') ?? '').trim();
  if (!name) return { error: 'Your name cannot be empty.' };

  const goalCents = parseAmountToCents(String(formData.get('daily_goal') ?? ''));
  if (goalCents === null) {
    return { error: 'Daily goal must be a number, like 400 or 250.50.' };
  }

  const currency = String(formData.get('currency') ?? current.currency);
  if (!CURRENCIES.includes(currency)) {
    return { error: 'Pick a currency from the list.' };
  }

  const timezone = String(formData.get('timezone') ?? current.timezone) || 'UTC';
  if (!isValidTimezone(timezone)) {
    return { error: 'That is not a timezone name. Try Detect, or e.g. Asia/Kathmandu.' };
  }
  const rollover = formData.get('rollover_enabled') === 'on';

  if (name !== user.name) {
    const { error } = await auth.updateUser({ name });
    if (error) return { error: error.message || 'Could not update your name.' };
  }

  await sql`
    update public.user_settings
    set daily_goal_cents = ${goalCents},
        currency = ${currency},
        timezone = ${timezone},
        rollover_enabled = ${rollover},
        updated_at = now()
    where user_id = ${user.id}
  `;

  // Record goal changes so past days keep the goal they were judged against.
  if (goalCents !== current.daily_goal_cents) {
    const today = await getToday(timezone);
    await sql`
      insert into public.goal_history (user_id, daily_goal_cents, effective_from)
      values (${user.id}, ${goalCents}, ${today})
    `;
  }

  refresh();
  return { ok: true, error: null };
}
