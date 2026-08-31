'use client';

import { useEffect, useRef, useState } from 'react';
import Spinner from './spinner';

/**
 * The save control, in four states rather than two.
 *
 *   idle     nothing has changed — present but inert, so nobody hunts for it
 *   dirty    a field was touched; the amber note is the warning you would
 *            otherwise only get by leaving the page and losing the edit
 *   saving   same width, same place, so the row does not jump mid-save
 *   saved    green tick, holds a couple of seconds, then falls back to idle
 *
 * Feedback belongs on the button because that is where the thumb already is —
 * a toast at the other end of the screen is something to catch, not to notice.
 */
export default function SaveBar({ state, disabled }) {
  const saving = state === 'saving';
  const saved = state === 'saved';
  const dirty = state === 'dirty';

  return (
    <div className="flex items-center justify-end gap-3">
      {dirty && (
        <span className="text-[13px]" style={{ color: 'var(--warn)' }} role="status">
          Unsaved changes
        </span>
      )}
      {saved && (
        <span className="text-[13px] text-muted" role="status">
          Just now
        </span>
      )}

      <button
        type="submit"
        disabled={disabled || saving || (!dirty && !saved)}
        aria-live="polite"
        // min-w keeps the three labels from resizing the control as it changes.
        className={`btn min-w-[9.5rem] !py-3 ${
          saved ? 'btn-ghost !border-transparent' : 'btn-primary'
        }`}
        style={
          saved
            ? {
                background: 'color-mix(in srgb, var(--good) 16%, transparent)',
                color: 'var(--good)',
              }
            : undefined
        }
      >
        {saving && (
          <>
            <Spinner size={16} label="Saving" />
            Saving…
          </>
        )}
        {saved && (
          <>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Saved
          </>
        )}
        {!saving && !saved && 'Save changes'}
      </button>
    </div>
  );
}

/**
 * Drives the four states from a form's action result.
 *
 * `saved` is deliberately temporary: a tick that stays forever stops meaning
 * "it worked just now" and becomes decoration.
 */
export function useSaveState(isPending, ok) {
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const seen = useRef(false);

  useEffect(() => {
    if (!ok || seen.current) return;
    seen.current = true;
    setDirty(false);
    setSaved(true);
    const timer = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(timer);
  }, [ok]);

  function markDirty() {
    seen.current = false;
    setSaved(false);
    setDirty(true);
  }

  const state = isPending ? 'saving' : saved ? 'saved' : dirty ? 'dirty' : 'idle';
  return { state, markDirty };
}
