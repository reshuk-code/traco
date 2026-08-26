import { formatAmount, formatMoney } from '@/lib/money';

/**
 * Last seven days. The faint column is that day's available budget, the solid
 * bar is what was actually spent — so a short bar in a tall column is a day
 * that fed the rollover.
 */
export default function WeekChart({ days, currency }) {
  const peak = Math.max(
    1,
    ...days.map((d) => Math.max(d.spent_cents, d.allowanceCents)),
  );

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">Last 7 days</h2>
        <span className="text-xs text-muted">spent vs available</span>
      </div>

      <div className="mt-4 flex h-32 items-end gap-2">
        {days.map((d) => {
          const budgetH = (Math.max(d.allowanceCents, 0) / peak) * 100;
          const spentH = (d.spent_cents / peak) * 100;
          return (
            <div key={d.day} className="flex h-full flex-1 flex-col items-center justify-end">
              <span className="mb-1 text-[10px] text-muted tabular-nums">
                {d.spent_cents > 0 ? formatAmount(d.spent_cents) : ''}
              </span>
              <div
                className="relative w-full rounded-t-md bg-track"
                style={{ height: `${Math.max(budgetH, spentH, 2)}%` }}
                title={`${d.day}: ${formatMoney(d.spent_cents, currency)} of ${formatMoney(d.allowanceCents, currency)}`}
              >
                <div
                  className="absolute inset-x-0 bottom-0 rounded-t-md"
                  style={{
                    height: `${(spentH / Math.max(budgetH, spentH, 2)) * 100}%`,
                    background: d.over ? 'var(--over)' : 'var(--brand)',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex gap-2">
        {days.map((d) => (
          <div key={d.day} className="flex-1 text-center text-[11px] text-muted">
            {new Date(`${d.day}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' })}
          </div>
        ))}
      </div>
    </div>
  );
}
