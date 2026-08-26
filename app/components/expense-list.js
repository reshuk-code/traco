'use client';

import { deleteExpense } from '@/app/actions/expenses';
import { removeFromOutbox } from '@/lib/outbox';
import { formatMoney } from '@/lib/money';

function timeOf(value) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function Row({ children }) {
  return <li className="flex items-center gap-3 py-3">{children}</li>;
}

export default function ExpenseList({ expenses, pending = [], currency, emptyText }) {
  if (expenses.length === 0 && pending.length === 0) {
    return <p className="py-4 text-sm text-muted">{emptyText}</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {pending.map((e) => (
        <Row key={e.id}>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium capitalize">
              {e.category}
              {e.note && <span className="font-normal text-muted"> · {e.note}</span>}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs" style={{ color: 'var(--warn)' }}>
              <span
                className="inline-block size-1.5 rounded-full"
                style={{ background: 'var(--warn)' }}
                aria-hidden="true"
              />
              Waiting to sync
            </p>
          </div>

          <span className="whitespace-nowrap font-semibold tabular-nums">
            {formatMoney(e.amount_cents, currency)}
          </span>

          <button
            type="button"
            onClick={() => removeFromOutbox([e.id])}
            aria-label="Discard this unsynced expense"
            title="Discard"
            className="cursor-pointer rounded-md px-2 py-1 text-lg leading-none text-muted hover:text-over"
          >
            ×
          </button>
        </Row>
      ))}

      {expenses.map((e) => (
        <Row key={e.id}>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium capitalize">
              {e.category}
              {e.note && <span className="font-normal text-muted"> · {e.note}</span>}
            </p>
            <p className="mt-0.5 text-xs text-muted">{timeOf(e.created_at)}</p>
          </div>

          <span className="whitespace-nowrap font-semibold tabular-nums">
            {formatMoney(e.amount_cents, currency)}
          </span>

          <form action={deleteExpense}>
            <input type="hidden" name="id" value={e.id} />
            <button
              type="submit"
              aria-label="Delete this expense"
              title="Delete"
              className="cursor-pointer rounded-md px-2 py-1 text-lg leading-none text-muted hover:text-over"
            >
              ×
            </button>
          </form>
        </Row>
      ))}
    </ul>
  );
}
