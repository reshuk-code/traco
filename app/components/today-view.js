'use client';

import GoalMeter from './goal-meter';
import ExpenseForm from './expense-form';
import ExpenseList from './expense-list';
import { useOutbox } from './use-outbox';
import { formatMoney } from '@/lib/money';

/**
 * Today's numbers, with anything still sitting in the offline outbox folded in
 * so the totals on screen match what the user actually spent — synced or not.
 */
export default function TodayView({ day, expenses, today, currency, rollover }) {
  const outbox = useOutbox();

  const pendingToday = outbox.filter((e) => e.spent_on === today);
  const pendingCents = pendingToday.reduce((sum, e) => sum + e.amount_cents, 0);
  const spentCents = day.spent_cents + pendingCents;
  const entryCount = day.entries + pendingToday.length;

  return (
    <>
      <section className="card p-5 sm:p-6">
        <GoalMeter
          baseCents={day.base_cents}
          carryInCents={day.carryInCents}
          allowanceCents={day.allowanceCents}
          spentCents={spentCents}
          currency={currency}
          rollover={rollover}
        />
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold">Log an expense</h2>
        <ExpenseForm today={today} currency={currency} />
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="text-sm font-semibold">
          Today&apos;s entries
          {entryCount > 0 && <span className="ml-2 font-normal text-muted">{entryCount}</span>}
        </h2>
        <ExpenseList
          expenses={expenses}
          pending={pendingToday}
          currency={currency}
          emptyText={
            rollover
              ? `Nothing logged yet — a quiet day adds ${formatMoney(day.allowanceCents, currency)} to tomorrow.`
              : 'Nothing logged yet today.'
          }
        />
      </section>
    </>
  );
}
