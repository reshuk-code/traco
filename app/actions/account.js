'use server';

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';
import { requireUser } from '@/lib/data';
import { APP } from '@/lib/app-info';

/**
 * Deletes the account and everything attached to it.
 *
 * Every table references neon_auth."user" with `on delete cascade`, so removing
 * the auth user removes expenses, goals, challenges, reminder subscriptions and
 * widget tokens with it. The rows are deleted here first anyway rather than
 * trusting the cascade blindly — if the auth call fails halfway, an orphaned
 * expense row is a worse outcome than a second delete that finds nothing.
 *
 * This is what makes the deletion promise in the privacy policy real rather
 * than an email address.
 */
export async function deleteAccount(_prevState, formData) {
  const user = await requireUser();

  // Typing the address is the confirmation: it cannot be produced by a stray
  // tap, and it names exactly what is about to be destroyed.
  const typed = String(formData.get('confirm_email') ?? '').trim().toLowerCase();
  if (typed !== String(user.email ?? '').toLowerCase()) {
    return { error: 'Type your email address exactly to confirm.' };
  }

  await sql`delete from public.push_subscriptions where user_id = ${user.id}`;
  await sql`delete from public.widget_tokens where user_id = ${user.id}`;
  await sql`delete from public.challenges where user_id = ${user.id}`;
  await sql`delete from public.expenses where user_id = ${user.id}`;
  await sql`delete from public.goal_history where user_id = ${user.id}`;
  await sql`delete from public.user_settings where user_id = ${user.id}`;

  const { error } = await auth.deleteUser();
  if (error) {
    return {
      error:
        error.message ||
        `Your data was removed but the account itself could not be closed. Contact ${APP.contactEmail}.`,
    };
  }

  redirect('/?deleted=1');
}
