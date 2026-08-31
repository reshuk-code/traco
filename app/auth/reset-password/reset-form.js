'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { resetPassword } from './actions';
import Spinner from '@/app/components/spinner';

/**
 * The token arrives as a prop from the page, not from `useSearchParams` — that
 * hook would defer this form to a client-only render, and a password form that
 * flashes empty is a form people abandon.
 */
export default function ResetForm({ token = '' }) {
  const [state, formAction, isPending] = useActionState(resetPassword, null);

  if (!token) {
    return (
      <div className="flex flex-1 flex-col pt-10">
        <h1 className="text-[1.75rem] font-bold tracking-tight">Link incomplete</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          This page needs the token from your reset email. Open the link from the
          email itself, or request a fresh one.
        </p>
        <div className="flex-1" />
        <Link href="/auth/forgot-password" className="btn btn-primary !py-3.5">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-1 flex-col">
      <input type="hidden" name="token" value={token} />

      <div className="pt-10">
        <h1 className="text-[1.75rem] font-bold tracking-tight">Set a new password</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          Pick something you&apos;ll remember. You&apos;ll sign in with it straight
          after.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <div>
          <label className="label" htmlFor="password">New password</label>
          <input id="password" name="password" type="password" required minLength={8}
            autoComplete="new-password" placeholder="At least 8 characters" className="field" />
        </div>
        <div>
          <label className="label" htmlFor="confirm">Confirm password</label>
          <input id="confirm" name="confirm" type="password" required minLength={8}
            autoComplete="new-password" placeholder="Type it again" className="field" />
        </div>
      </div>

      {state?.error && (
        <p className="mt-3 text-sm text-over" role="alert">{state.error}</p>
      )}

      <button type="submit" disabled={isPending} className="btn btn-primary mt-5 !py-3.5">
        {isPending ? <Spinner size={18} label="Saving" /> : 'Set new password'}
      </button>

      <div className="flex-1" />

      <p className="pt-6 text-center text-sm text-muted">
        <Link href="/auth/sign-in" className="font-semibold text-brand hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
