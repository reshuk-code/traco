'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { signInWithEmail } from './actions';

export default function SignInPage() {
  const [state, formAction, isPending] = useActionState(signInWithEmail, null);

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-muted">Sign in to log today&apos;s spending.</p>
        </div>

        <form action={formAction} className="card p-6 flex flex-col gap-4">
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

          {state?.error && (
            <p className="text-sm text-over" role="alert">{state.error}</p>
          )}

          <button type="submit" disabled={isPending} className="btn btn-primary mt-1">
            {isPending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          New here?{' '}
          <Link href="/auth/sign-up" className="font-medium text-brand hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
