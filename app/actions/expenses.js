'use server';

import { randomUUID } from 'node:crypto';
import { refresh } from 'next/cache';
import { sql, isConnectivityError } from '@/lib/db';
import { requireUser, getSettings, getToday } from '@/lib/data';
import { parseAmountToCents, CATEGORIES } from '@/lib/money';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function addExpense(_prevState, formData) {
  // Validate everything that needs no network first, so a submission made with
  // a dead connection still produces a well-formed entry to queue.
  const amountCents = parseAmountToCents(String(formData.get('amount') ?? ''));
  if (amountCents === null || amountCents === 0) {
    return { error: 'Enter how much you spent, like 250 or 99.50.' };
  }

  const category = String(formData.get('category') ?? 'other');
  if (!CATEGORIES.includes(category)) {
    return { error: 'Pick a category from the list.' };
  }

  const note = String(formData.get('note') ?? '').trim().slice(0, 200) || null;
  const rawDate = String(formData.get('spent_on') ?? '').trim();
  const clientToday = String(formData.get('client_today') ?? '').trim();
  const clientId = String(formData.get('client_id') ?? '');
  const id = UUID_RE.test(clientId) ? clientId : randomUUID();

  try {
    const user = await requireUser();
    const settings = await getSettings(user.id);
    const today = await getToday(settings.timezone);

    const spentOn = DATE_RE.test(rawDate) ? rawDate : today;
    if (spentOn > today) {
      return { error: 'You cannot log spending for a future date.' };
    }

    await sql`
      insert into public.expenses (id, user_id, amount_cents, category, note, spent_on)
      values (${id}, ${user.id}, ${amountCents}, ${category}, ${note}, ${spentOn})
      on conflict (id) do nothing
    `;
  } catch (error) {
    // `redirect()` from requireUser throws a control-flow signal, not a network
    // error, so it passes straight through this check and keeps working.
    if (isConnectivityError(error)) {
      const spentOn = DATE_RE.test(rawDate)
        ? rawDate
        : DATE_RE.test(clientToday)
          ? clientToday
          : null;

      if (!spentOn) {
        return { error: 'Could not reach the server, and no date was set.' };
      }

      return {
        queued: true,
        entry: { id, amount_cents: amountCents, category, note, spent_on: spentOn },
      };
    }
    throw error;
  }

  refresh();
  return { ok: true, error: null };
}

export async function deleteExpense(formData) {
  const user = await requireUser();
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  // Scoping the delete to the session user is what enforces ownership.
  await sql`
    delete from public.expenses
    where id = ${id} and user_id = ${user.id}
  `;

  refresh();
}

/**
 * Drains the offline outbox. Entries arrive with the id they were given on the
 * device, and the insert ignores conflicts, so replaying the same queue — after
 * a flaky reconnect, or from two tabs at once — cannot double-count anything.
 *
 * Returns the ids the client should stop holding: `accepted` reached the
 * database, `rejected` never will and would otherwise retry forever.
 */
export async function syncExpenses(entries) {
  const user = await requireUser();
  const settings = await getSettings(user.id);
  const today = await getToday(settings.timezone);

  const accepted = [];
  const rejected = [];

  for (const entry of (Array.isArray(entries) ? entries : []).slice(0, 200)) {
    const id = String(entry?.id ?? '');
    const amountCents = Number(entry?.amount_cents);
    const category = String(entry?.category ?? 'other');
    const note = entry?.note ? String(entry.note).trim().slice(0, 200) : null;
    const spentOn = String(entry?.spent_on ?? '');

    const valid =
      UUID_RE.test(id) &&
      Number.isInteger(amountCents) &&
      amountCents > 0 &&
      CATEGORIES.includes(category) &&
      DATE_RE.test(spentOn) &&
      spentOn <= today;

    if (!valid) {
      if (id) rejected.push(id);
      continue;
    }

    await sql`
      insert into public.expenses (id, user_id, amount_cents, category, note, spent_on)
      values (${id}, ${user.id}, ${amountCents}, ${category}, ${note}, ${spentOn})
      on conflict (id) do nothing
    `;
    accepted.push(id);
  }

  if (accepted.length > 0) refresh();
  return { accepted, rejected };
}
