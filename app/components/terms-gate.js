'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { acceptTerms } from '@/app/actions/terms';
import { signOut } from '@/app/auth/actions';
import { APP } from '@/lib/app-info';
import Spinner from './spinner';

/**
 * Shown to an account that has not accepted the current terms.
 *
 * Rendered by the server layout in place of the app, so it cannot be dismissed
 * by closing a dialog or disabling scripts — consent that can be swiped away is
 * not recorded consent. There is deliberately no "later": the honest way to
 * decline is to sign out, so that stays.
 */
export default function TermsGate({ returning }) {
  const [state, formAction, isPending] = useActionState(acceptTerms, null);

  return (
    <main className="flex flex-1 items-end justify-center px-4 pb-0 sm:items-center sm:pb-4">
      <div className="w-full max-w-md rounded-t-[1.5rem] border border-border bg-surface px-6 pb-8 pt-6 sm:rounded-[1.5rem]">
        <div className="mx-auto mb-5 h-1 w-9 rounded-full bg-border sm:hidden" aria-hidden="true" />

        <h1 className="text-[1.375rem] font-bold tracking-tight">
          {returning ? 'Before you carry on' : 'One thing first'}
        </h1>
        <p className="mt-2.5 text-[15px] leading-relaxed text-muted">
          {returning
            ? `We've published ${APP.name}'s Terms & Conditions and Privacy Policy. Have a read and accept them to keep using the app.`
            : `Please read ${APP.name}'s Terms & Conditions and Privacy Policy before you start.`}
        </p>

        <div className="mt-4 flex flex-col gap-2">
          {[
            { href: '/terms', label: 'Terms & Conditions' },
            { href: '/privacy', label: 'Privacy Policy' },
          ].map((doc) => (
            <Link
              key={doc.href}
              href={doc.href}
              className="flex items-center gap-3 rounded-inner border border-border bg-surface-2 px-4 py-3.5 hover:border-muted"
            >
              <span className="min-w-0 flex-1 text-[15px] font-medium">{doc.label}</span>
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                className="shrink-0 text-muted" aria-hidden="true"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Link>
          ))}
        </div>

        <form action={formAction}>
          <label className="mt-4 flex cursor-pointer items-start gap-3">
            <input
              name="agreed"
              type="checkbox"
              required
              className="mt-0.5 size-[22px] shrink-0 cursor-pointer accent-[var(--brand)]"
            />
            <span className="text-[13px] leading-relaxed text-muted">
              I&apos;ve read and agree to both.
            </span>
          </label>

          {state?.error && (
            <p className="mt-3 text-sm text-over" role="alert">{state.error}</p>
          )}

          <button type="submit" disabled={isPending} className="btn btn-primary mt-4 w-full !py-3.5">
            {isPending ? <Spinner size={18} label="Saving" /> : 'Accept and continue'}
          </button>
        </form>

        <form action={signOut} className="mt-3.5 text-center">
          <span className="text-[13px] text-muted">Not happy with this? </span>
          <button type="submit" className="cursor-pointer text-[13px] font-semibold text-brand hover:underline">
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
