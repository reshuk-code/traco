'use server';

import { refresh } from 'next/cache';
import { sql } from '@/lib/db';
import { requireUser } from '@/lib/data';
import { isTheme, isThemeMode } from '@/lib/themes';

/**
 * Saves the appearance choice to the account, so it follows the user to another
 * device. The browser also keeps a copy for the pre-paint script — the database
 * is the source of truth, that copy only exists to avoid a flash of the wrong
 * theme before the page has rendered.
 */
export async function updateTheme(theme, mode) {
  const user = await requireUser();

  if (!isTheme(theme)) return { error: 'Unknown theme.' };
  if (!isThemeMode(mode)) return { error: 'Unknown appearance mode.' };

  await sql`
    update public.user_settings
    set theme = ${theme}, theme_mode = ${mode}, updated_at = now()
    where user_id = ${user.id}
  `;

  refresh();
  return { ok: true, error: null };
}
