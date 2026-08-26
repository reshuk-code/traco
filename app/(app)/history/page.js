import Link from 'next/link';
import PageHeader from '@/app/components/page-header';
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

function dayLabel(day, today) {
  if (day === today) return 'Today';
  const date = new Date(`${day}T00:00:00`);
  const yesterday = new Date(`${today}T00:00:00`);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.getTime() === yesterday.getTime()) return 'Yesterday';
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() === yesterday.getFullYear() ? undefined : 'numeric',
  });
}

function Stat({ label, value }) {
  return (
    <div className="flex-1">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="mt-0.5 text-[15px] font-semibold tabular-nums">{value}</p>
    </div>
  );
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

  const rows = [...ledger].reverse().slice(0, 90);
  const avgCents =
    stats.daysWithSpending > 0
      ? Math.round(stats.spentCents / stats.daysWithSpending)
      : 0;

  return (
    <>
      <PageHeader
        title="History"
        subtitle={`${stats.daysWithSpending} ${stats.daysWithSpending === 1 ? 'day' : 'days'} tracked`}
      />

      <div className="mx-auto flex max-w-2xl flex-col gap-3.5 px-5 py-4">
        <section className="card p-[18px]">
          {rollover ? (
            <>
              <p className="text-xs text-muted">Saved up for tomorrow</p>
              <p
                className="mt-1 text-[2.125rem] font-bold leading-none tracking-tight tabular-nums"
                style={{ color: 'var(--good)' }}
              >
                {formatMoney(balance, settings.currency)}
              </p>
            </>
          ) : (
            <>
              <p className="text-xs text-muted">Days within goal</p>
              <p className="mt-1 text-[2.125rem] font-bold leading-none tracking-tight tabular-nums">
                {stats.daysWithinAllowance} / {ledger.length}
              </p>
            </>
          )}

          <div className="mt-4 flex gap-3 border-t border-border pt-3.5">
            <Stat label="Total spent" value={formatMoney(stats.spentCents, settings.currency)} />
            <Stat label="Average / day" value={formatMoney(avgCents, settings.currency)} />
            <Stat
              label="Within goal"
              value={`${stats.daysWithinAllowance} / ${ledger.length}`}
            />
          </div>
        </section>

        {stats.entries === 0 ? (
          <section className="card p-8 text-center">
            <p className="text-sm text-muted">You haven&apos;t logged anything yet.</p>
            <Link href="/dashboard" className="btn btn-primary mt-4">
              Log your first expense
            </Link>
          </section>
        ) : (
          rows.map((row, index) => (
            <details key={row.day} open={index === 0} className="card group px-[18px] py-4">
              <summary className="flex cursor-pointer list-none items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold">{dayLabel(row.day, today)}</p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {row.entries} {row.entries === 1 ? 'entry' : 'entries'} ·{' '}
                    {rollover ? 'available' : 'goal'}{' '}
                    {formatMoney(row.allowanceCents, settings.currency)}
                  </p>
                </div>

                <div className="text-right">
                  <p
                    className="text-[15px] font-bold tabular-nums"
                    style={{ color: row.over ? 'var(--over)' : 'var(--good)' }}
                  >
                    {formatMoney(row.spent_cents, settings.currency)}
                  </p>
                  <p className="mt-0.5 text-[11px] tabular-nums text-muted">
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

              <div className="mt-2.5 border-t border-border">
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
          ))
        )}
      </div>
    </>
  );
}
