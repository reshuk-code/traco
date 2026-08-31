'use client';

import { useActionState, useRef } from 'react';
import { updateTimezone } from '@/app/actions/settings';
import SaveBar, { useSaveState } from '@/app/components/save-bar';

export default function DayForm({ timezone }) {
  const [state, formAction, isPending] = useActionState(updateTimezone, null);
  const { state: saveState, markDirty } = useSaveState(isPending, state?.ok);
  const ref = useRef(null);

  function detect() {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && ref.current) {
        ref.current.value = tz;
        markDirty();
      }
    } catch {
      // Leave whatever is already in the field.
    }
  }

  return (
    <form action={formAction} onChange={markDirty} className="flex flex-col gap-3.5">
      <section className="card p-[18px]">
        <label className="label" htmlFor="timezone">Time zone</label>
        <div className="flex items-center gap-2">
          <input
            ref={ref}
            id="timezone"
            name="timezone"
            type="text"
            required
            defaultValue={timezone}
            className="field"
          />
          <button
            type="button"
            onClick={detect}
            className="shrink-0 cursor-pointer text-xs font-semibold text-brand hover:underline"
          >
            Detect
          </button>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">
          Midnight here is when your budget resets and yesterday&apos;s leftover rolls
          forward. Your daily reminder is sent on this clock too.
        </p>
      </section>

      {state?.error && <p className="text-sm text-over" role="alert">{state.error}</p>}

      <SaveBar state={saveState} />
    </form>
  );
}
