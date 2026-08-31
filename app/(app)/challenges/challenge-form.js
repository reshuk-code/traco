'use client';

import { useActionState, useState } from 'react';
import { createChallenge } from '@/app/actions/challenges';
import { summarizeWindow, buildPresets } from '@/lib/challenge';
import { formatMoney, currencySymbol } from '@/lib/money';
import Spinner from '@/app/components/spinner';

const QUICK_WINDOWS = [
  { label: 'Today', days: 1 },
  { label: '2 days', days: 2 },
  { label: '3 days', days: 3 },
  { label: '7 days', days: 7 },
  { label: '14 days', days: 14 },
  { label: '30 days', days: 30 },
];

const DEFAULT_WINDOW_DAYS = 7;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Formatted without `toLocaleDateString` on purpose: this renders on the server
 * too, and a server locale that disagrees with the browser's is a hydration
 * mismatch. Fixed month names are the same in both places.
 */
function prettyDay(iso) {
  const [, m, d] = iso.split('-');
  return `${Number(d)} ${MONTHS[Number(m) - 1]}`;
}

function daysBefore(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

/**
 * Starting a challenge.
 *
 * The window decides which overspend counts as the target, and the target sizes
 * the presets — so the whole panel recomputes as the date changes. That is why
 * it is worked out here rather than on the server: no round trip per tap.
 *
 * The challenge itself always begins today. Backdating one would judge days
 * already lived and could create a challenge that was broken before it started.
 */
export default function ChallengeForm({ days, goalCents, currency, today, earliest }) {
  const [state, formAction, isPending] = useActionState(createChallenge, null);

  const [since, setSince] = useState(() => daysBefore(today, DEFAULT_WINDOW_DAYS - 1));
  const [chosen, setChosen] = useState('half');
  const [capOverride, setCapOverride] = useState(null);
  const [daysOverride, setDaysOverride] = useState(null);
  const [slips, setSlips] = useState('2');

  const counted = summarizeWindow(days, since);
  const presets = buildPresets(counted.overspentCents, goalCents);

  // Cap and length are derived from the chosen preset, so changing the window
  // moves them on its own. A manual edit takes over until another preset is picked.
  const active = presets.find((p) => p.id === chosen) ?? null;
  const cap = capOverride ?? (active ? String(active.capCents / 100) : '');
  const length = daysOverride ?? (active ? String(active.days) : '14');

  // Editing one field pins the other where it is. Deselecting the preset must
  // not quietly snap the untouched field back to a default.
  function editCap(value) {
    if (daysOverride === null && active) setDaysOverride(String(active.days));
    setCapOverride(value);
    setChosen(null);
  }

  function editLength(value) {
    if (capOverride === null && active) setCapOverride(String(active.capCents / 100));
    setDaysOverride(value);
    setChosen(null);
  }

  function pickPreset(id) {
    setChosen(id);
    setCapOverride(null);
    setDaysOverride(null);
  }

  function pickWindow(n) {
    setSince(daysBefore(today, n - 1));
  }

  const activeWindow = QUICK_WINDOWS.find((w) => daysBefore(today, w.days - 1) === since);
  const hasTarget = counted.overspentCents > 0;

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      <input type="hidden" name="target_cents" value={counted.overspentCents || ''} />

      <section className="card p-[18px]">
        <h2 className="text-[13px] font-semibold">Count what you&apos;ve gone over</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Pick how far back to look. That total becomes what the challenge sets out
          to recover.
        </p>

        <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
          {QUICK_WINDOWS.map((w) => {
            const selected = activeWindow?.days === w.days;
            return (
              <button
                key={w.days}
                type="button"
                aria-pressed={selected}
                onClick={() => pickWindow(w.days)}
                className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] transition-colors ${
                  selected
                    ? 'bg-brand font-semibold text-brand-text'
                    : 'border border-border bg-surface-2 font-medium text-muted hover:text-text'
                }`}
              >
                {w.label}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center gap-2.5">
          <label className="shrink-0 text-xs text-muted" htmlFor="since">
            or from
          </label>
          <input
            id="since"
            type="date"
            value={since}
            min={earliest}
            max={today}
            onChange={(e) => {
              if (e.target.value) setSince(e.target.value);
            }}
            className="field"
          />
        </div>

        <div className="mt-3.5 border-t border-border pt-3.5">
          {hasTarget ? (
            <>
              <p className="text-xs text-muted">Gone over since {prettyDay(since)}</p>
              <p
                className="mt-1 text-[2.125rem] font-bold leading-none tracking-tight tabular-nums"
                style={{ color: 'var(--over)' }}
              >
                {formatMoney(counted.overspentCents, currency)}
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">
                Across {counted.daysOver} of {counted.daysCounted}{' '}
                {counted.daysCounted === 1 ? 'day' : 'days'} — about{' '}
                {(counted.overspentCents / goalCents).toFixed(1)} days of budget. traco
                never charges this back to you as debt, but you can choose to claw it
                back.
              </p>
            </>
          ) : (
            <>
              <p className="text-[15px] font-semibold">
                Nothing gone over since {prettyDay(since)}
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                Look further back to find something to recover, or just set yourself a
                cap and hold it.
              </p>
            </>
          )}
        </div>
      </section>

      <section className="card p-[18px]">
        <h2 className="text-[13px] font-semibold">Pick a pace</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          {hasTarget
            ? 'These all clear the same amount. The slower ones are the ones people actually finish.'
            : 'How strict the cap is, and how long you hold it.'}
        </p>

        <div className="mt-3 flex flex-col gap-2">
          {presets.map((p) => {
            const selected = p.id === chosen;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => pickPreset(p.id)}
                aria-pressed={selected}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-inner border bg-surface-2 px-3.5 py-3 text-left transition-colors ${
                  selected ? 'border-brand' : 'border-border hover:border-muted'
                }`}
              >
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold">{p.label}</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {p.capCents === 0
                      ? 'Nothing at all'
                      : `${formatMoney(p.capCents, currency)} a day`}
                    {p.partial
                      ? ` · recovers ${formatMoney(p.clearsCents, currency)} of it`
                      : ` · saves ${formatMoney(p.perDayCents, currency)} a day`}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-[15px] font-bold tabular-nums">{p.days}</span>
                  <span className="block text-[11px] text-muted">days</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="card p-[18px]">
        <label className="text-xs text-muted" htmlFor="cap">
          Daily cap
        </label>
        <div className="mt-2.5 flex items-center gap-2.5 rounded-field border border-border bg-surface-2 px-3.5 py-3 focus-within:border-brand">
          <span className="text-[15px] font-semibold text-muted">
            {currencySymbol(currency)}
          </span>
          <input
            id="cap"
            name="cap"
            type="text"
            inputMode="decimal"
            required
            value={cap}
            onChange={(e) => editCap(e.target.value)}
            className="w-full bg-transparent text-2xl font-bold tracking-tight tabular-nums outline-none"
          />
        </div>
        <p className="mt-2 text-xs text-muted">
          Set this to 0 for a run where you spend nothing at all.
        </p>

        <div className="mt-4 flex gap-3">
          <div className="flex-1">
            <label className="label" htmlFor="days">Length</label>
            <div className="flex items-center gap-2">
              <input
                id="days"
                name="days"
                type="number"
                min={1}
                max={90}
                required
                value={length}
                onChange={(e) => editLength(e.target.value)}
                className="field"
              />
              <span className="shrink-0 text-[13px] text-muted">days</span>
            </div>
          </div>

          <div className="flex-1">
            <label className="label" htmlFor="allowed_slips">Slip days</label>
            <select
              id="allowed_slips"
              name="allowed_slips"
              value={slips}
              onChange={(e) => setSlips(e.target.value)}
              className="field cursor-pointer"
            >
              {[0, 1, 2, 3, 5].map((n) => (
                <option key={n} value={n}>
                  {n === 0 ? 'None — strict' : `${n} allowed`}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          A slip day is one where you go over the cap. Allowing a couple keeps one
          bad afternoon from ending a three-week run. The challenge starts today.
        </p>
      </section>

      {state?.error && <p className="text-sm text-over" role="alert">{state.error}</p>}

      <button type="submit" disabled={isPending} className="btn btn-primary !py-3">
        {isPending ? <Spinner size={18} label="Starting" /> : 'Start challenge'}
      </button>
    </form>
  );
}
