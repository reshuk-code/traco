'use client';

import { useActionState } from 'react';
import { updateBudget } from '@/app/actions/settings';
import { CURRENCIES, currencySymbol } from '@/lib/money';
import SaveBar, { useSaveState } from '@/app/components/save-bar';

export default function BudgetForm({ settings, averageLabel }) {
  const [state, formAction, isPending] = useActionState(updateBudget, null);
  const { state: saveState, markDirty } = useSaveState(isPending, state?.ok);

  return (
    <form action={formAction} onChange={markDirty} className="flex flex-col gap-3.5">
      <section className="card p-[18px]">
        <label className="text-xs text-muted" htmlFor="daily_goal">
          Daily spending goal
        </label>
        <div className="mt-2.5 flex items-center gap-2.5 rounded-field border border-border bg-surface-2 px-3.5 py-3 focus-within:border-brand">
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

        <div className="mt-4">
          <label className="label" htmlFor="currency">Currency</label>
          <select
            id="currency"
            name="currency"
            defaultValue={settings.currency}
            className="field cursor-pointer"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
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

      {state?.error && <p className="text-sm text-over" role="alert">{state.error}</p>}

      <SaveBar state={saveState} />
    </form>
  );
}
