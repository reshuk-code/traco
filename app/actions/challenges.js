'use server';

import { refresh } from 'next/cache';
import { sql } from '@/lib/db';
import {
  requireUser,
  getSettings,
  getToday,
  getActiveChallenge,
  loadLedger,
} from '@/lib/data';
import { evaluateChallenge } from '@/lib/challenge';
import { parseAmountToCents } from '@/lib/money';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAX_DAYS = 90;
const MAX_SLIPS = 10;

function parseCount(value, max) {
  const n = Number(String(value ?? '').trim());
  return Number.isInteger(n) && n >= 0 && n <= max ? n : null;
}

export async function createChallenge(_prevState, formData) {
  const user = await requireUser();
  const settings = await getSettings(user.id);
  const today = await getToday(settings.timezone);

  // A cap of zero is legitimate — that is the no-spend run, and it needs no
  // special handling anywhere.
  const capCents = parseAmountToCents(String(formData.get('cap') ?? ''));
  if (capCents === null) {
    return { error: 'Daily cap must be a number, like 100 or 0.' };
  }
  if (capCents >= settings.daily_goal_cents) {
    return { error: 'The cap has to be below your daily goal, or nothing is saved.' };
  }

  const days = parseCount(formData.get('days'), MAX_DAYS);
  if (days === null || days < 1) {
    return { error: `Pick a length between 1 and ${MAX_DAYS} days.` };
  }

  const slips = parseCount(formData.get('allowed_slips'), MAX_SLIPS);
  if (slips === null) {
    return { error: `Allow between 0 and ${MAX_SLIPS} slip days.` };
  }

  const targetRaw = String(formData.get('target_cents') ?? '').trim();
  const targetCents = /^\d+$/.test(targetRaw) ? Number(targetRaw) : null;

  // A finished challenge still sits in the table as `active`, because its result
  // is derived rather than written on a schedule. Settle it here, on the one
  // occasion the answer is actually needed.
  const existing = await getActiveChallenge(user.id);
  if (existing) {
    const ledger = await loadLedger(user.id, settings, today);
    const result = evaluateChallenge(existing, ledger, today);

    if (!result.finished) {
      return { error: 'You already have a challenge running. End that one first.' };
    }

    await sql`
      update public.challenges
      set status = ${result.state === 'failed' ? 'failed' : 'completed'}
      where id = ${existing.id} and user_id = ${user.id}
    `;
  }

  await sql`
    insert into public.challenges
      (user_id, kind, cap_cents, starts_on, ends_on, allowed_slips, target_cents)
    values (
      ${user.id}, 'spend_under', ${capCents},
      ${today}::date, ${today}::date + ${days - 1}::int,
      ${slips}, ${targetCents}
    )
  `;

  refresh();
  return { ok: true, error: null };
}

export async function endChallenge(formData) {
  const user = await requireUser();
  const settings = await getSettings(user.id);
  const today = await getToday(settings.timezone);

  const id = String(formData.get('id') ?? '');
  // A non-uuid makes Postgres raise a cast error rather than matching nothing.
  if (!UUID_RE.test(id)) return;

  // Scoping to the session user is what enforces ownership, as with expenses.
  // `ended_on` freezes the window, so the days already lived keep their verdicts.
  await sql`
    update public.challenges
    set status = 'abandoned', ended_on = ${today}::date
    where id = ${id} and user_id = ${user.id} and status = 'active'
  `;

  refresh();
}
