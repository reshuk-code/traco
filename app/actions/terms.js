'use server';

import { refresh } from 'next/cache';
import { sql } from '@/lib/db';
import { requireUser } from '@/lib/data';
import { APP } from '@/lib/app-info';

/**
 * Records which version of the terms was accepted, and when.
 *
 * The version is what makes this useful later: it is the difference between
 * "they agreed to something once" and being able to say what they agreed to,
 * and it is what lets the gate reappear when the policies change.
 */
export async function acceptTerms(_prevState, formData) {
  const user = await requireUser();

  if (formData.get('agreed') !== 'on') {
    return { error: 'Tick the box to accept the terms.' };
  }

  await sql`
    update public.user_settings
    set terms_version = ${APP.termsVersion},
        terms_accepted_at = now(),
        updated_at = now()
    where user_id = ${user.id}
  `;

  refresh();
  return { ok: true, error: null };
}
