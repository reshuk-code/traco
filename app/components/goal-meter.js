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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Spent today</p>
          <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums">
            {formatMoney(spentCents, currency)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted">
            {rollover ? 'Available today' : 'Daily goal'}
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {formatMoney(allowanceCents, currency)}
          </p>
        </div>
      </div>

      <div
        className="mt-4 h-3 w-full overflow-hidden rounded-full bg-track"
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

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="font-medium" style={{ color }}>{label}</span>
        <span className="tabular-nums text-muted">
          {over
            ? `${formatMoney(-left, currency)} over`
            : `${formatMoney(left, currency)} left today`}
        </span>
      </div>

      {over && (
        <p
          className="mt-4 rounded-xl px-4 py-3 text-sm"
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
      )}

      {rollover && !over && (
        <div className="mt-4 rounded-xl bg-surface-2 px-4 py-3 text-sm">
          <div className="flex items-center justify-between gap-3 tabular-nums">
            <span className="text-muted">Today&apos;s goal</span>
            <span className="font-medium">{formatMoney(baseCents, currency)}</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-3 tabular-nums">
            <span className="text-muted">Saved up from before</span>
            <span className="font-medium" style={{ color: 'var(--good)' }}>
              +{formatMoney(carryInCents, currency)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 border-t border-border pt-2 tabular-nums">
            <span className="font-medium">Available today</span>
            <span className="font-bold">{formatMoney(allowanceCents, currency)}</span>
          </div>
          <p className="mt-2 text-xs text-muted">
            Whatever is left tonight ({formatMoney(left, currency)}) is added to
            tomorrow&apos;s {formatMoney(baseCents, currency)}.
          </p>
        </div>
      )}
    </div>
  );
}
