'use client';

import Link from 'next/link';
import { evaluateChallenge } from '@/lib/challenge';
import { formatMoney } from '@/lib/money';
import { useOutbox } from './use-outbox';

const STATES = {
  on_track: { label: 'On track', color: 'var(--good)' },
  at_risk: { label: 'Over today', color: 'var(--warn)' },
  failed: { label: 'Broken', color: 'var(--over)' },
  complete: { label: 'Finished', color: 'var(--brand)' },
};

function Bar({ pct, color, track = 'var(--track)' }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: track }}>
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }}
      />
    </div>
  );
}

/**
 * A challenge's own verdict, kept deliberately separate from the budget meter
 * above it: the ledger says whether the day was fine, this says whether the
 * challenge was kept. The two can disagree, and that is the point.
 *
 * Evaluation happens here rather than on the server because the offline outbox
 * only exists on the device — money logged with no signal still counts against
 * the cap.
 */
export default function ChallengeCard({
  challenge,
  challengeDays,
  today,
  currency,
  detailed = false,
}) {
  const outbox = useOutbox();
  const pendingCents = outbox
    .filter((e) => e.spent_on === today)
    .reduce((sum, e) => sum + e.amount_cents, 0);

  const r = evaluateChallenge(challenge, challengeDays, today, pendingCents);
  if (!r) return null;

  const { label, color } = STATES[r.state];
  const capLabel = r.capCents === 0 ? 'Spend nothing' : `Under ${formatMoney(r.capCents, currency)} a day`;

  return (
    <section className="card p-[18px]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted">Your challenge</p>
          <p className="mt-1 text-[17px] font-bold tracking-tight">{capLabel}</p>
        </div>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}
        >
          {label}
        </span>
      </div>

      <div className="mt-3.5 flex items-baseline justify-between text-[13px]">
        <span className="text-muted">
          Day {Math.min(r.daysElapsed, r.daysTotal)} of {r.daysTotal}
        </span>
        <span className="tabular-nums text-muted">
          {r.daysLeft} {r.daysLeft === 1 ? 'day' : 'days'} left
        </span>
      </div>
      <div className="mt-2">
        <Bar pct={r.progressPct} color={color} />
      </div>

      {/* Today against the cap — the number that decides whether the day counts. */}
      <div className="mt-3.5 flex items-center justify-between gap-3 rounded-inner bg-surface-2 px-3.5 py-3 tabular-nums">
        <span className="text-[13px] text-muted">
          Today {formatMoney(r.todaySpentCents, currency)}
          {r.capCents > 0 && <> of {formatMoney(r.capCents, currency)}</>}
        </span>
        <span
          className="text-[13px] font-semibold"
          style={{ color: r.todayLeftCents < 0 ? 'var(--over)' : 'var(--good)' }}
        >
          {r.todayLeftCents < 0
            ? `${formatMoney(-r.todayLeftCents, currency)} over`
            : `${formatMoney(r.todayLeftCents, currency)} left`}
        </span>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-3 text-[13px]">
        <span className="text-muted">
          {r.slipsUsed} of {r.allowedSlips} slip {r.allowedSlips === 1 ? 'day' : 'days'} used
        </span>
        <span
          className="font-semibold tabular-nums"
          style={{ color: r.slipsLeft === 0 ? 'var(--over)' : 'var(--muted)' }}
        >
          {r.state === 'failed' ? 'none left' : `${r.slipsLeft} left`}
        </span>
      </div>

      {r.targetCents > 0 && (
        <div className="mt-3.5 border-t border-border pt-3.5">
          <div className="flex items-baseline justify-between text-[13px]">
            <span className="text-muted">Recovered</span>
            <span className="font-semibold tabular-nums">
              {formatMoney(r.recoveredCents, currency)} of{' '}
              {formatMoney(r.targetCents, currency)}
            </span>
          </div>
          <div className="mt-2">
            <Bar pct={r.recoveryPct} color="var(--good)" />
          </div>
        </div>
      )}

      {detailed && r.days.length > 0 && (
        <div className="mt-3.5 border-t border-border pt-3.5">
          <p className="text-xs text-muted">Day by day</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {r.days.map((d) => (
              <span
                key={d.day}
                title={`${d.day}: ${formatMoney(d.spentCents, currency)}`}
                className="size-6 rounded-md"
                style={{
                  background: d.slipped
                    ? 'var(--over)'
                    : 'color-mix(in srgb, var(--good) 65%, transparent)',
                }}
              />
            ))}
            {Array.from({ length: r.daysLeft }, (_, i) => (
              <span key={`future-${i}`} className="size-6 rounded-md bg-track" />
            ))}
          </div>
        </div>
      )}

      {!detailed && (
        <Link
          href="/challenges"
          className="mt-3.5 block text-center text-xs font-semibold text-brand hover:underline"
        >
          View challenge
        </Link>
      )}
    </section>
  );
}
