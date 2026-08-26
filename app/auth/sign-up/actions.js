'use server';

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';
import { parseAmountToCents } from '@/lib/money';

export async function signUpWithEmail(_prevState, formData) {
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const goalRaw = String(formData.get('daily_goal') ?? '').trim();
  const currency = String(formData.get('currency') ?? 'NPR');
  const timezone = String(formData.get('timezone') ?? 'UTC') || 'UTC';

  if (!name) return { error: 'Please enter your name.' };
  if (!email) return { error: 'Please enter your email address.' };
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' };
  }

  const goalCents = goalRaw ? parseAmountToCents(goalRaw) : 40000;
  if (goalCents === null) {
    return { error: 'Daily goal must be a number, like 400 or 250.50.' };
  }

  const { data, error } = await auth.signUp.email({ email, name, password });

  if (error) {
    return { error: error.message || 'Could not create your account.' };
  }

  const userId = data?.user?.id;
  if (userId) {
    // Seed the goal the user picked during sign-up.
    await sql`
      insert into public.user_settings (user_id, daily_goal_cents, currency, timezone)
      values (${userId}, ${goalCents}, ${currency}, ${timezone})
      on conflict (user_id) do update
        set daily_goal_cents = excluded.daily_goal_cents,
            currency = excluded.currency,
            timezone = excluded.timezone,
            updated_at = now()
    `;
    await sql`
      insert into public.goal_history (user_id, daily_goal_cents, effective_from)
      values (${userId}, ${goalCents}, (now() at time zone ${timezone})::date)
    `;
  }

  redirect('/dashboard');
}
