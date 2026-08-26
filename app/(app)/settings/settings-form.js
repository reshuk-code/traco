'use client';

import { useActionState, useRef } from 'react';
import { updateSettings } from '@/app/actions/settings';
import { CURRENCIES, currencySymbol } from '@/lib/money';
import Spinner from '@/app/components/spinner';

function Row({ label, hint, children }) {
  return (
    <div className="flex items-center gap-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-[15px]">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

export default function SettingsForm({ user, settings, averageLabel }) {
  const [state, formAction, isPending] = useActionState(updateSettings, null);
  const tzRef = useRef(null);

  function detectTimezone() {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && tzRef.current) tzRef.current.value = tz;
    } catch {
      // Leave whatever is already in the field.
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      {/* The goal drives every other number in the app, so it leads. */}
      <section className="card p-[18px]">
        <label className="text-xs text-muted" htmlFor="daily_goal">
          Daily spending goal
        </label>
        <div className="mt-2.5 flex items-center gap-2.5 rounded-[0.625rem] border border-border bg-surface-2 px-3.5 py-3 focus-within:border-brand">
          <span className="text-[15px] font-semibold text-muted">
            {currencySymbol(settings.currency)}
          </span>
          <input
            id="daily_goal"
            name="daily_goal"
            type="text"
            inputMode="decimal"
            required
            defaultValue={(settings.daily_goal_cents / 100).toString()}
            className="w-full bg-transparent text-2xl font-bold tracking-tight tabular-nums outline-none"
          />
        </div>
        {averageLabel && (
          <p className="mt-2.5 text-xs leading-relaxed text-muted">{averageLabel}</p>
        )}
      </section>

      <section className="card p-[18px]">
        <label htmlFor="rollover_enabled" className="flex cursor-pointer items-start gap-4">
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold">Roll over what you save</span>
            <span className="mt-1.5 block text-[13px] leading-relaxed text-muted">
              Unspent money is added to tomorrow. Overspending never carries forward.
            </span>
          </span>
          <input
            id="rollover_enabled"
            name="rollover_enabled"
            type="checkbox"
            defaultChecked={settings.rollover_enabled}
            className="peer sr-only"
          />
          {/* The knob is a child, not a sibling, so it is reached through the
              track's own peer-checked variant rather than its own. */}
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-[27px] w-[46px] shrink-0 items-center rounded-full bg-track p-[3px] transition-colors peer-checked:bg-brand peer-checked:[&>span]:translate-x-[19px] peer-focus-visible:ring-2 peer-focus-visible:ring-brand/50"
          >
            <span className="size-[21px] rounded-full bg-white transition-transform" />
          </span>
        </label>
      </section>

      <section className="card divide-y divide-border px-[18px] py-1.5">
        <Row label="Your name">
          <input
            name="name"
            type="text"
            required
            defaultValue={user.name}
            className="w-40 bg-transparent text-right text-[15px] outline-none focus:text-brand sm:w-56"
          />
        </Row>

        <Row label="Currency">
          <select
            name="currency"
            defaultValue={settings.currency}
            className="cursor-pointer bg-transparent text-right text-[15px] text-muted outline-none focus:text-brand"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Row>

        <Row label="Time zone" hint="Decides when your day rolls over">
          <span className="flex items-center gap-2">
            <input
              ref={tzRef}
              name="timezone"
              type="text"
              required
              defaultValue={settings.timezone}
              className="w-32 bg-transparent text-right text-[15px] text-muted outline-none focus:text-brand sm:w-44"
            />
            <button
              type="button"
              onClick={detectTimezone}
              className="shrink-0 cursor-pointer text-xs font-semibold text-brand hover:underline"
            >
              Detect
            </button>
          </span>
        </Row>
      </section>

      {state?.error && <p className="text-sm text-over" role="alert">{state.error}</p>}
      {state?.ok && !state.error && (
        <p className="text-sm text-good" role="status">Saved.</p>
      )}

      <button type="submit" disabled={isPending} className="btn btn-primary !py-3">
        {isPending ? <Spinner size={18} label="Saving" /> : 'Save changes'}
      </button>
    </form>
  );
}
