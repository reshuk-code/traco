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

  // Formatted once: the strings drive both the display and the size the
  // headline has to drop to in order to fit beside Available.
  const spentLabel = formatMoney(spentCents, currency);
  const allowanceLabel = formatMoney(allowanceCents, currency);

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted">Spent today</p>
          {/*
            The headline shrinks as the number grows. A fixed text-4xl is fine
            at "NPR 145" and runs straight through the Available column at
            "NPR 23,142.00" — and min-w-0 is what actually lets a flex child
            give way, since flex items refuse to shrink below their content
            without it.
          */}
          <p
            className={`mt-1 truncate font-bold leading-none tracking-tight tabular-nums ${spentLabel.length > 13 ? 'text-2xl' : spentLabel.length > 10 ? 'text-3xl' : 'text-4xl'}`}
          >
            {spentLabel}
          </p>
        </div>
        <div className="min-w-0 shrink-0 text-right">
          <p className="text-xs text-muted">{rollover ? 'Available' : 'Goal'}</p>
          <p
            className={`mt-1 font-bold tabular-nums ${allowanceLabel.length > 13 ? 'text-sm' : 'text-lg'}`}
          >
            {allowanceLabel}
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
          className="mt-3.5 rounded-inner px-3.5 py-3 text-[13px] leading-relaxed"
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
          <div className="mt-3.5 flex items-center justify-between gap-3 rounded-inner bg-surface-2 px-3.5 py-3 tabular-nums">
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
