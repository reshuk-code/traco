'use client';

import { useEffect, useState, useTransition } from 'react';
import { updateTheme } from '@/app/actions/theme';
import { THEMES, THEME_MODES } from '@/lib/themes';
import { applyTheme } from './theme-sync';

const MODE_NOTE = {
  system: 'Follows your phone.',
  light: 'Always light, whatever your phone is set to.',
  dark: 'Always dark, whatever your phone is set to.',
};

/**
 * Appearance.
 *
 * The choice is applied to the page the instant it is tapped and saved in the
 * background — a theme you have to wait for is a theme you cannot browse.
 *
 * Each swatch is a real miniature: `data-preview` scopes that theme's own
 * variables to the tile, so a swatch shows the geometry too — Void's missing
 * outline, Bloom's big corners — not just three colours.
 */
export default function ThemePicker({ theme: savedTheme, mode: savedMode }) {
  const [theme, setTheme] = useState(savedTheme);
  const [mode, setMode] = useState(savedMode);
  const [systemDark, setSystemDark] = useState(true);
  const [error, setError] = useState(null);
  const [, startTransition] = useTransition();

  // Swatches have to show what the choice will actually look like, so 'system'
  // needs resolving here rather than left to a media query on each tile.
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => setSystemDark(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  const resolved = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;

  function choose(nextTheme, nextMode) {
    setTheme(nextTheme);
    setMode(nextMode);
    setError(null);
    applyTheme(nextTheme, nextMode);

    startTransition(async () => {
      const result = await updateTheme(nextTheme, nextMode);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-1 rounded-inner bg-surface-2 p-1">
        {THEME_MODES.map((m) => {
          const on = m.id === mode;
          return (
            <button
              key={m.id}
              type="button"
              aria-pressed={on}
              onClick={() => choose(theme, m.id)}
              className={`cursor-pointer rounded-field py-2 text-center text-[13px] transition-colors ${
                on ? 'bg-surface font-semibold text-text shadow-sm' : 'font-medium text-muted hover:text-text'
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        {MODE_NOTE[mode]}
        {mode === 'system' && ` It's on ${systemDark ? 'dark' : 'light'} right now.`}
      </p>

      <div className="mt-4 flex flex-col gap-1.5">
        {THEMES.map((t) => {
          const on = t.id === theme;
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={on}
              onClick={() => choose(t.id, mode)}
              className={`flex cursor-pointer items-center gap-3 rounded-inner border p-[7px] text-left transition-colors ${
                on ? 'border-brand/45 bg-brand/10' : 'border-transparent hover:bg-surface-2'
              }`}
            >
              {/* The tile inherits this theme's own tokens, geometry included. */}
              <span
                data-preview={t.id}
                data-preview-mode={resolved}
                className="flex h-11 w-[62px] shrink-0 items-center p-[7px]"
                style={{ background: 'var(--bg)', borderRadius: 'var(--radius)' }}
                aria-hidden="true"
              >
                <span
                  className="flex w-full flex-col gap-1 px-1.5 py-1"
                  style={{
                    background: 'var(--surface)',
                    border: 'var(--card-border)',
                    borderRadius: 'var(--radius-control)',
                    boxShadow: 'var(--card-shadow)',
                  }}
                >
                  <span
                    className="block h-1 w-5 rounded-full"
                    style={{ background: 'var(--brand)' }}
                  />
                  <span className="flex gap-[3px]">
                    <span className="block size-[5px] rounded-full" style={{ background: 'var(--good)' }} />
                    <span className="block size-[5px] rounded-full" style={{ background: 'var(--warn)' }} />
                    <span className="block size-[5px] rounded-full" style={{ background: 'var(--over)' }} />
                  </span>
                </span>
              </span>

              <span className="min-w-0 flex-1">
                <span className={`block text-sm ${on ? 'font-semibold' : 'font-medium'}`}>
                  {t.label}
                </span>
                <span className="mt-px block text-[11px] text-muted">{t.blurb}</span>
              </span>

              <span
                className={`flex size-[18px] shrink-0 items-center justify-center rounded-full ${
                  on ? 'bg-brand' : ''
                }`}
              >
                {on && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
                    className="text-brand-text" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-3 text-sm text-over" role="alert">{error}</p>
      )}
    </div>
  );
}
