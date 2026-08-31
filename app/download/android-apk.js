'use client';

import { useState } from 'react';

const APK_PATH = '/traco.apk';
const APK_SIZE = '898 KB';

/**
 * The Android build, offered as a direct download.
 *
 * This is the only way to get the home-screen widget: a widget is native code
 * that no web app can provide, so it needs the wrapped APK. Everything else on
 * this page — the installable web app — works without it.
 *
 * Sideloading always looks alarming the first time, so the steps are shown up
 * front rather than left for the user to discover mid-install.
 */
export default function AndroidApk() {
  const [showSteps, setShowSteps] = useState(false);

  return (
    <section className="card p-5 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight">Android app with widget</h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
            The same traco, wrapped as an Android app so it can put a{' '}
            <strong className="text-text">home-screen widget</strong> on your phone —
            today&apos;s number visible without unlocking anything. Everything above
            works without this.
          </p>
          <p className="mt-2 text-xs text-muted">
            {APK_SIZE} · not on the Play Store · installs directly
          </p>
        </div>

        <a
          href={APK_PATH}
          download="traco.apk"
          className="btn btn-primary shrink-0 !px-6 !py-3.5 sm:!py-3"
        >
          Download APK
        </a>
      </div>

      <button
        type="button"
        onClick={() => setShowSteps((v) => !v)}
        className="mt-4 cursor-pointer text-sm font-semibold text-brand hover:underline"
      >
        {showSteps ? 'Hide install steps' : 'How to install it'}
      </button>

      {showSteps && (
        <ol className="mt-4 flex flex-col gap-4 border-t border-border pt-4">
          {[
            [
              'Tap the downloaded file',
              'From your notification shade, or Files → Downloads → traco.apk.',
            ],
            [
              'Allow installing from this source',
              'Android asks once, per app. It is the standard warning for anything that did not come from the Play Store.',
            ],
            [
              'Add the widget',
              'Long-press your home screen → Widgets → traco → drag it out.',
            ],
            [
              'Paste a widget token',
              'Settings → Home-screen widget → Generate, then paste it into the widget when it asks.',
            ],
          ].map(([title, detail], i) => (
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
      )}
    </section>
  );
}
