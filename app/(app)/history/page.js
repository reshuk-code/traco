import Link from 'next/link';
import ExpenseList from '@/app/components/expense-list';
import {
  requireUser,
  getSettings,
  getToday,
  getAllExpenses,
  loadLedger,
} from '@/lib/data';
import { summarize } from '@/lib/budget';
import { formatMoney } from '@/lib/money';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'History · traco' };

function Stat({ label, value, color }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums" style={color ? { color } : undefined}>
        {value}
      </p>
    </div>
  );
}

function dayLabel(day, today) {
  if (day === today) return 'Today';
  const date = new Date(`${day}T00:00:00`);
  const yesterday = new Date(`${today}T00:00:00`);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.getTime() === yesterday.getTime()) return 'Yesterday';
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === yesterday.getFullYear() ? undefined : 'numeric',
  });
}

export default async function HistoryPage() {
  const user = await requireUser();
  const settings = await getSettings(user.id);
  const today = await getToday(settings.timezone);

  const [ledger, expenses] = await Promise.all([
    loadLedger(user.id, settings, today),
    getAllExpenses(user.id),
  ]);

  const rollover = settings.rollover_enabled;
  const stats = summarize(ledger);
  const balance = ledger.at(-1)?.balanceAfterCents ?? 0;

  const byDay = new Map();
  for (const e of expenses) {
    if (!byDay.has(e.spent_on)) byDay.set(e.spent_on, []);
    byDay.get(e.spent_on).push(e);
  }

  // Newest first, and only days that either had spending or carry a balance
  // worth explaining.
  const rows = [...ledger].reverse().slice(0, 90);
  const avgCents =
    stats.daysWithSpending > 0
      ? Math.round(stats.spentCents / stats.daysWithSpending)
      : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">History</h1>
        <p className="mt-1 text-sm text-muted">
          {rollover
            ? 'Every day, what it allowed, what you spent, and what rolled forward.'
            : 'Every day you logged, and every expense inside it.'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total spent" value={formatMoney(stats.spentCents, settings.currency)} />
        <Stat label="Days tracked" value={stats.daysWithSpending} />
        <Stat label="Average / spending day" value={formatMoney(avgCents, settings.currency)} />
        {rollover ? (
          <Stat
            label="Saved up for tomorrow"
            value={formatMoney(balance, settings.currency)}
            color="var(--good)"
          />
        ) : (
          <Stat
            label="Days within goal"
            value={`${stats.daysWithinAllowance} / ${ledger.length}`}
          />
        )}
      </div>

      {stats.entries === 0 ? (
        <section className="card p-8 text-center">
          <p className="text-muted">You haven&apos;t logged anything yet.</p>
          <Link href="/dashboard" className="btn btn-primary mt-4">
            Log your first expense
          </Link>
        </section>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row, index) => (
            <details key={row.day} open={index === 0} className="card group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{dayLabel(row.day, today)}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {row.entries} {row.entries === 1 ? 'entry' : 'entries'} · available{' '}
                    {formatMoney(row.allowanceCents, settings.currency)}
                    {rollover && row.carryInCents > 0 && (
                      <>
                        {' '}
                        ({formatMoney(row.base_cents, settings.currency)} +{' '}
                        {formatMoney(row.carryInCents, settings.currency)} saved)
                      </>
                    )}
                  </p>
                </div>

                <div className="text-right">
                  <p
                    className="font-bold tabular-nums"
                    style={{ color: row.over ? 'var(--over)' : 'var(--good)' }}
                  >
                    {formatMoney(row.spent_cents, settings.currency)}
                  </p>
                  <p className="mt-0.5 text-xs tabular-nums text-muted">
                    {row.over
                      ? `−${formatMoney(row.overByCents, settings.currency)} over`
                      : rollover
                        ? `${formatMoney(row.balanceAfterCents, settings.currency)} rolled on`
                        : `${formatMoney(row.leftoverCents, settings.currency)} under`}
                  </p>
                </div>

                <span
                  className="text-muted transition-transform group-open:rotate-90"
                  aria-hidden="true"
                >
                  ›
                </span>
              </summary>

              <div className="mt-2 border-t border-border pt-1">
                <ExpenseList
                  expenses={byDay.get(row.day) ?? []}
                  currency={settings.currency}
                  emptyText={
                    rollover
                      ? `Nothing spent — the full ${formatMoney(row.allowanceCents, settings.currency)} rolled forward.`
                      : 'No entries recorded for this day.'
                  }
                />
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
