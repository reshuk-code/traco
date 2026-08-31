'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { requestPasswordReset } from './actions';
import Spinner from '@/app/components/spinner';

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(requestPasswordReset, null);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-8">
      <div className="py-4">
        <Link href="/" className="text-[17px] font-bold tracking-tight">
          traco
        </Link>
      </div>

      {state?.sent ? (
        <div className="flex flex-1 flex-col">
          <div className="pt-10">
            <h1 className="text-[1.75rem] font-bold tracking-tight">Check your email</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              If that address has an account, a reset link is on its way. It expires
              shortly, so use it soon — and check your spam folder if it doesn&apos;t
              appear.
            </p>
          </div>

          <div className="flex-1" />

          <Link href="/auth/sign-in" className="btn btn-ghost !py-3.5">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form action={formAction} className="flex flex-1 flex-col">
          <div className="pt-10">
            <h1 className="text-[1.75rem] font-bold tracking-tight">Reset your password</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              Enter your email and we&apos;ll send you a link to set a new one.
            </p>
          </div>

          <div className="mt-6">
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              className="field"
            />
          </div>

          {state?.error && (
            <p className="mt-3 text-sm text-over" role="alert">{state.error}</p>
          )}

          <button type="submit" disabled={isPending} className="btn btn-primary mt-5 !py-3.5">
            {isPending ? <Spinner size={18} label="Sending" /> : 'Send reset link'}
          </button>

          <div className="flex-1" />

          <p className="pt-6 text-center text-sm text-muted">
            Remembered it?{' '}
            <Link href="/auth/sign-in" className="font-semibold text-brand hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      )}
    </main>
  );
}
