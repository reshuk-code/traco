'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { signInWithEmail } from './actions';
import Spinner from '@/app/components/spinner';

export default function SignInPage() {
  const [state, formAction, isPending] = useActionState(signInWithEmail, null);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-8">
      <div className="py-4">
        <Link href="/" className="text-[17px] font-bold tracking-tight">
          traco
        </Link>
      </div>

      <form action={formAction} className="flex flex-1 flex-col">
        <div className="pt-10">
          <h1 className="text-[1.75rem] font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            Sign in to log today&apos;s spending.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required autoComplete="email"
              placeholder="you@example.com" className="field" />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required
              autoComplete="current-password" placeholder="••••••••" className="field" />
          </div>
        </div>

        {state?.error && (
          <p className="mt-3 text-sm text-over" role="alert">{state.error}</p>
        )}

        <button type="submit" disabled={isPending} className="btn btn-primary mt-5 !py-3.5">
          {isPending ? <Spinner size={18} label="Signing in" /> : 'Sign in'}
        </button>

        <div className="flex-1" />

        <p className="pt-6 text-center text-sm text-muted">
          New here?{' '}
          <Link href="/auth/sign-up" className="font-semibold text-brand hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </main>
  );
}
