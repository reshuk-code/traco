'use client';

import GoalMeter from './goal-meter';
import ExpenseForm from './expense-form';
import ExpenseList from './expense-list';
import { useOutbox } from './use-outbox';

/**
 * Today's numbers, with anything still sitting in the offline outbox folded in
 * so the totals on screen match what the user actually spent — synced or not.
 */
export default function TodayView({ day, expenses, today, currency, rollover, challengeSlot }) {
  const outbox = useOutbox();

  const pendingToday = outbox.filter((e) => e.spent_on === today);
  const pendingCents = pendingToday.reduce((sum, e) => sum + e.amount_cents, 0);
  const spentCents = day.spent_cents + pendingCents;
  const entryCount = day.entries + pendingToday.length;

  return (
    <>
      <section className="card p-[18px]">
        <GoalMeter
          baseCents={day.base_cents}
          carryInCents={day.carryInCents}
          allowanceCents={day.allowanceCents}
          spentCents={spentCents}
          currency={currency}
          rollover={rollover}
        />
      </section>

      {/* The challenge sits directly under the meter: two verdicts on the same
          day, which are allowed to disagree. */}
      {challengeSlot}

      <section className="card p-[18px]">
        <h2 className="mb-3 text-[13px] font-semibold">Log an expense</h2>
        <ExpenseForm today={today} currency={currency} />
      </section>

      <section className="card p-[18px]">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[13px] font-semibold">Today&apos;s entries</h2>
          {entryCount > 0 && <span className="text-xs text-muted">{entryCount}</span>}
        </div>
        <ExpenseList
          expenses={expenses}
          pending={pendingToday}
          currency={currency}
          emptyText="Nothing logged yet today."
        />
      </section>
    </>
  );
}
