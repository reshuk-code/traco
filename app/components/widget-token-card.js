'use client';

import { useActionState, useState } from 'react';
import { createWidgetToken, revokeWidgetToken } from '@/app/actions/widget';
import Spinner from './spinner';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function shortDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/**
 * Tokens for the Android home-screen widget.
 *
 * The raw token comes back from the action exactly once and is never stored in a
 * recoverable form, so it is held in component state and shown until the user
 * navigates away. After that the only option is to revoke and mint another.
 */
export default function WidgetTokenCard({ tokens, siteUrl }) {
  const [state, formAction, isPending] = useActionState(createWidgetToken, null);
  const [copied, setCopied] = useState(null);

  async function copy(value, label) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard refused — both values are on screen to copy by hand anyway.
    }
  }

  const feedUrl = state?.token
    ? `${siteUrl}/api/widget/summary?token=${encodeURIComponent(state.token)}`
    : null;

  return (
    <div>
      <p className="text-[13px] leading-relaxed text-muted">
        A widget runs outside the app, so it signs in with a token rather than
        your password. The token is read-only — it can show today&apos;s numbers
        and nothing else.
      </p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
        Need the widget itself?{' '}
        <a href="/download" className="font-semibold text-brand hover:underline">
          Download the Android app
        </a>
        {' '}— a home-screen widget needs the installed app, not the web version.
      </p>

      {state?.token && (
        <div
          className="mt-3.5 rounded-inner px-3.5 py-3"
          style={{ background: 'color-mix(in srgb, var(--warn) 12%, transparent)' }}
        >
          <p className="text-xs font-semibold" style={{ color: 'var(--warn)' }}>
            Copy this now — it can&apos;t be shown again.
          </p>

          <p className="mt-2.5 text-[11px] text-muted">Token, for the traco APK</p>
          <code className="mt-1 block break-all font-mono text-[12px] leading-relaxed">
            {state.token}
          </code>
          <button
            type="button"
            onClick={() => copy(state.token, 'token')}
            className="btn btn-ghost mt-2 !py-1.5 !text-[12px]"
          >
            {copied === 'token' ? 'Copied' : 'Copy token'}
          </button>

          {/* For widget apps that can only fetch a plain URL and cannot set a
              header — KWGT, Tasker, and the various HTTP-widget apps. */}
          <p className="mt-3.5 text-[11px] text-muted">
            Full URL, for KWGT / Tasker / any widget app
          </p>
          <code className="mt-1 block break-all font-mono text-[11px] leading-relaxed text-muted">
            {feedUrl}
          </code>
          <button
            type="button"
            onClick={() => copy(feedUrl, 'url')}
            className="btn btn-ghost mt-2 !py-1.5 !text-[12px]"
          >
            {copied === 'url' ? 'Copied' : 'Copy URL'}
          </button>
        </div>
      )}

      {tokens.length > 0 && (
        <ul className="mt-3.5 divide-y divide-border border-t border-border">
          {tokens.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium">{t.label}</p>
                <p className="mt-0.5 text-[11px] text-muted">
                  added {shortDate(t.created_at)}
                  {t.last_used_at ? ` · last used ${shortDate(t.last_used_at)}` : ' · never used'}
                </p>
              </div>
              <form action={revokeWidgetToken}>
                <input type="hidden" name="id" value={t.id} />
                <button
                  type="submit"
                  className="cursor-pointer text-[13px] font-semibold text-over hover:underline"
                >
                  Revoke
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="mt-3.5 flex gap-2">
        <input
          name="label"
          type="text"
          maxLength={40}
          placeholder="Which device?"
          className="field"
        />
        <button
          type="submit"
          disabled={isPending}
          className="btn btn-ghost shrink-0 !py-2.5 !text-[13px]"
        >
          {isPending ? <Spinner size={16} label="Generating" /> : 'Generate'}
        </button>
      </form>

      {state?.error && (
        <p className="mt-2.5 text-sm text-over" role="alert">
          {state.error}
        </p>
      )}
    </div>
  );
}
