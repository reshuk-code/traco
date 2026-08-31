'use server';

import { refresh } from 'next/cache';
import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';
import { requireUser, getSettings, getToday } from '@/lib/data';
import { parseAmountToCents, CURRENCIES, MAX_AMOUNT } from '@/lib/money';
import { isValidTimezone } from '@/lib/timezone';

/**
 * One action per settings page, rather than one that validates everything.
 *
 * When all four fields lived on one screen a single action made sense. Split
 * across pages it stops making sense: saving your name would have to resend a
 * goal and a timezone the page never showed, and any of them could fail the
 * save for a reason not visible on screen.
 */

export async function updateBudget(_prevState, formData) {
  const user = await requireUser();
  const current = await getSettings(user.id);

  const goalCents = parseAmountToCents(String(formData.get('daily_goal') ?? ''));
  if (goalCents === null) {
    return {
      error: `Daily goal must be a number, like 400 or 250.50 (up to ${MAX_AMOUNT.toLocaleString('en-US')}).`,
    };
  }

  const currency = String(formData.get('currency') ?? current.currency);
  if (!CURRENCIES.includes(currency)) {
    return { error: 'Pick a currency from the list.' };
  }

  const rollover = formData.get('rollover_enabled') === 'on';

  await sql`
    update public.user_settings
    set daily_goal_cents = ${goalCents},
        currency = ${currency},
        rollover_enabled = ${rollover},
        updated_at = now()
    where user_id = ${user.id}
  `;

  // Record goal changes so past days keep the goal they were judged against.
  if (goalCents !== current.daily_goal_cents) {
    const today = await getToday(current.timezone);
    await sql`
      insert into public.goal_history (user_id, daily_goal_cents, effective_from)
      values (${user.id}, ${goalCents}, ${today})
    `;
  }

  refresh();
  return { ok: true, error: null };
}

export async function updateTimezone(_prevState, formData) {
  const user = await requireUser();

  const timezone = String(formData.get('timezone') ?? '').trim();
  if (!isValidTimezone(timezone)) {
    return { error: 'That is not a timezone name. Try Detect, or e.g. Asia/Kathmandu.' };
  }

  await sql`
    update public.user_settings
    set timezone = ${timezone}, updated_at = now()
    where user_id = ${user.id}
  `;

  refresh();
  return { ok: true, error: null };
}

export async function updateName(_prevState, formData) {
  const user = await requireUser();

  const name = String(formData.get('name') ?? '').trim();
  if (!name) return { error: 'Your name cannot be empty.' };
  if (name.length > 80) return { error: 'That name is too long.' };

  if (name !== user.name) {
    const { error } = await auth.updateUser({ name });
    if (error) return { error: error.message || 'Could not update your name.' };
  }

  refresh();
  return { ok: true, error: null };
}
