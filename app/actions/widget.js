'use server';

import { refresh } from 'next/cache';
import { sql } from '@/lib/db';
import { requireUser } from '@/lib/data';
import { newWidgetToken, hashWidgetToken } from '@/lib/widget-token';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAX_TOKENS = 5;

/**
 * Mints a token for one device's widget.
 *
 * The raw value is returned exactly once, here — only its hash is stored, so it
 * cannot be shown again. Losing it means revoking and minting another.
 */
export async function createWidgetToken(_prevState, formData) {
  const user = await requireUser();

  const label = String(formData.get('label') ?? '').trim().slice(0, 40) || 'Android widget';

  const existing = await sql`
    select count(*)::int as n from public.widget_tokens where user_id = ${user.id}
  `;
  if (existing[0].n >= MAX_TOKENS) {
    return { error: `You already have ${MAX_TOKENS} widget tokens. Revoke one first.` };
  }

  const token = newWidgetToken();
  await sql`
    insert into public.widget_tokens (user_id, token_hash, label)
    values (${user.id}, ${hashWidgetToken(token)}, ${label})
  `;

  refresh();
  return { ok: true, token, error: null };
}

export async function revokeWidgetToken(formData) {
  const user = await requireUser();
  const id = String(formData.get('id') ?? '');
  // A non-uuid makes Postgres raise a cast error rather than matching nothing.
  if (!UUID_RE.test(id)) return;

  // Scoped to the session user, the same ownership rule the rest of the app uses.
  await sql`
    delete from public.widget_tokens
    where id = ${id} and user_id = ${user.id}
  `;

  refresh();
}
