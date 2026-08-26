'use client';

import { useActionState, useRef } from 'react';
import { updateSettings } from '@/app/actions/settings';
import { CURRENCIES } from '@/lib/money';

export default function SettingsForm({ user, settings }) {
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
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className="label" htmlFor="name">Your name</label>
        <input id="name" name="name" type="text" required defaultValue={user.name}
          className="field" />
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
        <div>
          <label className="label" htmlFor="daily_goal">Daily spending goal</label>
          <input id="daily_goal" name="daily_goal" type="text" inputMode="decimal" required
            defaultValue={(settings.daily_goal_cents / 100).toString()}
            className="field text-lg font-semibold tabular-nums" />
        </div>
        <div>
          <label className="label" htmlFor="currency">Currency</label>
          <select id="currency" name="currency" defaultValue={settings.currency} className="field">
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-2 p-4">
        <label htmlFor="rollover_enabled" className="flex cursor-pointer items-start gap-3">
          <input id="rollover_enabled" name="rollover_enabled" type="checkbox"
            defaultChecked={settings.rollover_enabled}
            className="mt-0.5 size-4 shrink-0 accent-[var(--brand)]" />
          <span>
            <span className="block text-sm font-medium">Roll over what you don&apos;t spend</span>
            <span className="mt-1 block text-xs text-muted">
              Anything left at the end of a day is added to the next day&apos;s budget, and
              overspending is taken off it. Turn this off to judge every day against the
              goal on its own.
            </span>
          </span>
        </label>
      </div>

      <div>
        <label className="label" htmlFor="timezone">Timezone</label>
        <div className="flex gap-2">
          <input ref={tzRef} id="timezone" name="timezone" type="text" required
            defaultValue={settings.timezone} className="field" />
          <button type="button" onClick={detectTimezone} className="btn btn-ghost whitespace-nowrap">
            Detect
          </button>
        </div>
        <p className="mt-1.5 text-xs text-muted">
          Decides when your day rolls over, so &ldquo;today&rdquo; matches your clock.
        </p>
      </div>

      {state?.error && <p className="text-sm text-over" role="alert">{state.error}</p>}
      {state?.ok && !state.error && (
        <p className="text-sm text-good" role="status">Saved.</p>
      )}

      <button type="submit" disabled={isPending} className="btn btn-primary self-start">
        {isPending ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}
