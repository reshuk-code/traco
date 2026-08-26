'use client';

import { useActionState } from 'react';
import { useOffline } from 'next/offline';
import { addExpense } from '@/app/actions/expenses';
import { addToOutbox, newId } from '@/lib/outbox';
import { parseAmountToCents, CATEGORIES } from '@/lib/money';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function buildEntry(formData, id, fallbackDate) {
  const amountCents = parseAmountToCents(String(formData.get('amount') ?? ''));
  if (amountCents === null || amountCents === 0) return null;

  const raw = String(formData.get('spent_on') ?? '').trim();
  return {
    id,
    amount_cents: amountCents,
    category: String(formData.get('category') ?? 'other'),
    note: String(formData.get('note') ?? '').trim().slice(0, 200) || null,
    spent_on: DATE_RE.test(raw) ? raw : fallbackDate,
    queued_at: new Date().toISOString(),
  };
}

export default function ExpenseForm({ today, currency }) {
  const isOffline = useOffline();

  const [state, formAction, isPending] = useActionState(async (prev, formData) => {
    // The id is minted here so the local copy and the eventual database row are
    // the same record, however many times the entry gets replayed.
    const id = newId();
    formData.set('client_id', id);
    formData.set('client_today', today);

    if (isOffline) {
      const entry = buildEntry(formData, id, today);
      if (!entry) return { error: 'Enter how much you spent, like 250 or 99.50.' };
      addToOutbox(entry);
      return { queuedLocal: true };
    }

    const result = await addExpense(prev, formData);

    // The server was reachable but the database was not.
    if (result?.queued && result.entry) {
      addToOutbox(result.entry);
      return { queuedLocal: true };
    }
    return result;
  }, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
        <div>
          <label className="label" htmlFor="amount">
            How much did you spend? ({currency})
          </label>
          <input id="amount" name="amount" type="text" inputMode="decimal" required
            autoComplete="off" placeholder="250"
            className="field text-lg font-semibold tabular-nums" />
        </div>
        <div>
          <label className="label" htmlFor="category">Category</label>
          <select id="category" name="category" defaultValue="food" className="field capitalize">
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_11rem]">
        <div>
          <label className="label" htmlFor="note">Note (optional)</label>
          <input id="note" name="note" type="text" maxLength={200}
            placeholder="nasta, vada, indrive…" className="field" />
        </div>
        <div>
          <label className="label" htmlFor="spent_on">Date</label>
          <input id="spent_on" name="spent_on" type="date" defaultValue={today}
            max={today} className="field" />
        </div>
      </div>

      {state?.error && <p className="text-sm text-over" role="alert">{state.error}</p>}
      {state?.queuedLocal && (
        <p className="text-sm text-warn" role="status">
          Saved on this device. It will sync the moment you&apos;re back online.
        </p>
      )}

      <button type="submit" disabled={isPending} className="btn btn-primary self-start">
        {isPending ? 'Saving…' : isOffline ? 'Save offline' : 'Log expense'}
      </button>
    </form>
  );
}
