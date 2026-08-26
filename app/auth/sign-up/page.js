'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { signUpWithEmail } from './actions';
import TimezoneField from '../timezone-field';
import { CURRENCIES } from '@/lib/money';

export default function SignUpPage() {
  const [state, formAction, isPending] = useActionState(signUpWithEmail, null);

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Start tracking</h1>
          <p className="mt-2 text-sm text-muted">
            Set a daily spending goal and log against it every day.
          </p>
        </div>

        <form action={formAction} className="card p-6 flex flex-col gap-4">
          <TimezoneField />

          <div>
            <label className="label" htmlFor="name">Your name</label>
            <input id="name" name="name" type="text" required autoComplete="name"
              placeholder="Reshuk" className="field" />
          </div>

          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required autoComplete="email"
              placeholder="you@example.com" className="field" />
          </div>

          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required
              autoComplete="new-password" minLength={8} placeholder="At least 8 characters"
              className="field" />
          </div>

          <div className="grid grid-cols-[1fr_7rem] gap-3">
            <div>
              <label className="label" htmlFor="daily_goal">Daily spending goal</label>
              <input id="daily_goal" name="daily_goal" type="text" inputMode="decimal"
                defaultValue="400" placeholder="400" className="field" />
            </div>
            <div>
              <label className="label" htmlFor="currency">Currency</label>
              <select id="currency" name="currency" defaultValue="NPR" className="field">
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {state?.error && (
            <p className="text-sm text-over" role="alert">{state.error}</p>
          )}

          <button type="submit" disabled={isPending} className="btn btn-primary mt-1">
            {isPending ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link href="/auth/sign-in" className="font-medium text-brand hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
