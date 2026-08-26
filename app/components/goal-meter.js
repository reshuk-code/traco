import { formatMoney } from '@/lib/money';

function tone(ratio) {
  if (ratio > 1) return { color: 'var(--over)', label: 'Over today' };
  if (ratio >= 0.8) return { color: 'var(--warn)', label: 'Nearly used up' };
  return { color: 'var(--good)', label: 'Within budget' };
}

export default function GoalMeter({
  baseCents,
  carryInCents,
  allowanceCents,
  spentCents,
  currency,
  rollover,
}) {
  const ratio = allowanceCents > 0 ? spentCents / allowanceCents : spentCents > 0 ? Infinity : 0;
  const { color, label } = tone(ratio);
  const width = Math.min(100, allowanceCents > 0 ? Math.max(0, ratio) * 100 : 0);
  const left = allowanceCents - spentCents;
  const over = left < 0;

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs text-muted">Spent today</p>
          <p className="mt-1 text-4xl font-bold leading-none tracking-tight tabular-nums">
            {formatMoney(spentCents, currency)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">{rollover ? 'Available' : 'Goal'}</p>
          <p className="mt-1 text-lg font-bold tabular-nums">
            {formatMoney(allowanceCents, currency)}
          </p>
        </div>
      </div>

      <div
        className="mt-3.5 h-2 w-full overflow-hidden rounded-full bg-track"
        role="progressbar"
        aria-valuenow={Math.round(width)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Share of today's budget spent"
      >
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${width}%`, background: color }}
        />
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-3">
        <span className="text-[13px] font-medium" style={{ color }}>{label}</span>
        <span className="text-[13px] tabular-nums text-muted">
          {over
            ? `${formatMoney(-left, currency)} over`
            : `${formatMoney(left, currency)} left`}
        </span>
      </div>

      {over ? (
        <p
          className="mt-3.5 rounded-xl px-3.5 py-3 text-[13px] leading-relaxed"
          role="status"
          style={{
            background: 'color-mix(in srgb, var(--over) 12%, transparent)',
            color: 'var(--over)',
          }}
        >
          You spent <strong>{formatMoney(-left, currency)}</strong> more than today&apos;s
          budget.{' '}
          {rollover
            ? `No debt carries over — tomorrow starts fresh at ${formatMoney(baseCents, currency)}.`
            : 'Tomorrow starts fresh.'}
        </p>
      ) : (
        rollover && (
          <div className="mt-3.5 flex items-center justify-between gap-3 rounded-xl bg-surface-2 px-3.5 py-3 tabular-nums">
            <span className="text-[13px] text-muted">
              Goal {formatMoney(baseCents, currency)}
              {carryInCents > 0 && (
                <>
                  {'  +  '}saved {formatMoney(carryInCents, currency)}
                </>
              )}
            </span>
            <span className="text-[13px] font-semibold">
              {formatMoney(allowanceCents, currency)}
            </span>
          </div>
        )
      )}
    </div>
  );
}
