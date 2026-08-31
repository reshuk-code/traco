'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useOffline } from 'next/offline';
import { addExpense } from '@/app/actions/expenses';
import { addToOutbox, newId } from '@/lib/outbox';
import { parseAmountToCents, CATEGORIES, currencySymbol } from '@/lib/money';
import Spinner from './spinner';

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
  const [category, setCategory] = useState('food');
  const amountRef = useRef(null);

  // The launcher shortcut lands here with the keyboard already up, so logging
  // from the home screen is one tap and a number.
  const wantsLog = useSearchParams().get('log') === '1';
  useEffect(() => {
    if (wantsLog) amountRef.current?.focus();
  }, [wantsLog]);
  const [showDetails, setShowDetails] = useState(false);

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
    <form action={formAction}>
      <input type="hidden" name="category" value={category} />

      <label
        htmlFor="amount"
        className="flex items-center gap-2.5 rounded-[0.625rem] border border-border bg-surface-2 px-3.5 py-3 focus-within:border-brand"
      >
        <span className="text-[15px] font-semibold text-muted">{currencySymbol(currency)}</span>
        <input
          ref={amountRef}
          id="amount"
          name="amount"
          type="text"
          inputMode="decimal"
          required
          autoComplete="off"
          placeholder="0"
          className="w-full bg-transparent text-2xl font-bold tracking-tight tabular-nums outline-none placeholder:text-muted/50"
        />
      </label>

      {/* One row, swipeable — every category stays one tap away. */}
      <div
        role="radiogroup"
        aria-label="Category"
        className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1"
      >
        {CATEGORIES.map((c) => {
          const selected = c === category;
          return (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setCategory(c)}
              className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] capitalize transition-colors ${
                selected
                  ? 'bg-brand font-semibold text-brand-text'
                  : 'border border-border bg-surface-2 font-medium text-muted hover:text-text'
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>

      {showDetails && (
        <div className="mt-3 flex flex-col gap-3">
          <div>
            <label className="label" htmlFor="note">Note</label>
            <input id="note" name="note" type="text" maxLength={200}
              placeholder="nasta, vada, indrive…" className="field" />
          </div>
          <div>
            <label className="label" htmlFor="spent_on">Date</label>
            <input id="spent_on" name="spent_on" type="date" defaultValue={today}
              max={today} className="field" />
          </div>
        </div>
      )}

      {state?.error && (
        <p className="mt-3 text-sm text-over" role="alert">{state.error}</p>
      )}
      {state?.queuedLocal && (
        <p className="mt-3 text-sm text-warn" role="status">
          Saved on this device. It will sync the moment you&apos;re back online.
        </p>
      )}

      <button type="submit" disabled={isPending} className="btn btn-primary mt-3.5 w-full !py-3">
        {isPending ? <Spinner size={18} label="Saving" /> : isOffline ? 'Save offline' : 'Add expense'}
      </button>

      <button
        type="button"
        onClick={() => setShowDetails((v) => !v)}
        className="mt-2.5 w-full cursor-pointer text-center text-xs text-muted hover:text-text"
      >
        {showDetails ? 'Hide note and date' : 'Add a note or change the date'}
      </button>
    </form>
  );
}
