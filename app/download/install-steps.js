'use client';

import { useState, useSyncExternalStore } from 'react';

const PLATFORMS = [
  {
    id: 'ios',
    label: 'iPhone',
    browser: 'Safari',
    steps: [
      ['Open this page in Safari', 'Chrome on iOS cannot install apps — it has to be Safari.'],
      ['Tap the Share button', 'The square with an arrow, at the bottom of the screen.'],
      ['Choose "Add to Home Screen"', 'Scroll the share sheet down if you do not see it.'],
    ],
  },
  {
    id: 'android',
    label: 'Android',
    browser: 'Chrome',
    steps: [
      ['Open this page in Chrome', 'Most Chrome-based Android browsers work too.'],
      ['Tap "Install traco" above', 'Or open the browser menu and choose "Install app".'],
      ['Confirm Install', 'traco lands in your app drawer like any other app.'],
    ],
  },
  {
    id: 'desktop',
    label: 'Desktop',
    browser: 'Chrome or Edge',
    steps: [
      ['Use Chrome or Edge', 'Safari and Firefox on desktop cannot install web apps.'],
      ['Click "Install traco" above', 'Or use the install icon at the right of the address bar.'],
      ['Confirm Install', 'traco opens in its own window, with no browser tabs.'],
    ],
  },
];

function detect() {
  const ua = navigator.userAgent;
  const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  if (/iPad|iPhone|iPod/.test(ua) || iPadOS) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

const noSubscribe = () => () => {};

export default function InstallSteps() {
  // Detected on the client; the server renders the desktop copy until then.
  const detected = useSyncExternalStore(noSubscribe, detect, () => 'desktop');
  const [chosen, setChosen] = useState(null);

  const activeId = chosen ?? detected;
  const active = PLATFORMS.find((p) => p.id === activeId) ?? PLATFORMS[2];

  return (
    <section id="install-steps" className="card scroll-mt-8 p-5 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold tracking-tight">How to install</h2>
        {/* Full-width segmented control on mobile so each tab is a real target. */}
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-surface-2 p-1 sm:flex">
          {PLATFORMS.map((p) => {
            const isActive = p.id === activeId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setChosen(p.id)}
                aria-pressed={isActive}
                className={
                  isActive
                    ? 'rounded-lg bg-surface px-3 py-2 text-sm font-medium text-text sm:py-1.5'
                    : 'rounded-lg px-3 py-2 text-sm font-medium text-muted hover:text-text sm:py-1.5'
                }
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-3 text-sm text-muted">
        On {active.label}, use <strong className="text-text">{active.browser}</strong>.
        {activeId === detected && (
          <span className="ml-1" style={{ color: 'var(--good)' }}>
            That looks like the device you&apos;re on.
          </span>
        )}
      </p>

      <ol className="mt-6 flex flex-col gap-5">
        {active.steps.map(([title, detail], i) => (
          <li key={title} className="flex gap-4">
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold"
              style={{ background: 'var(--brand)', color: 'var(--brand-text)' }}
            >
              {i + 1}
            </span>
            <div className="pt-0.5">
              <p className="font-medium">{title}</p>
              <p className="mt-1 text-sm text-muted">{detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
