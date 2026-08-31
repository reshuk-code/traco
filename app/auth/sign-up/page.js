'use client';

import Link from 'next/link';
import { useActionState, useRef, useState } from 'react';
import { signUpWithEmail } from './actions';
import TimezoneField from '../timezone-field';
import { CURRENCIES, currencySymbol } from '@/lib/money';
import Spinner from '@/app/components/spinner';

const QUICK_PICKS = ['200', '400', '600', '1000'];

export default function SignUpPage() {
  const [state, formAction, isPending] = useActionState(signUpWithEmail, null);
  const [currency, setCurrency] = useState('NPR');
  const goalRef = useRef(null);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-8">
      <div className="py-4">
        <Link href="/" className="text-[17px] font-bold tracking-tight">
          traco
        </Link>
      </div>

      <form action={formAction} className="flex flex-1 flex-col">
        <TimezoneField />

        <div className="pt-7">
          <h1 className="text-[1.75rem] font-bold tracking-tight">Set your daily goal</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            Start with a number that feels realistic &mdash; you can change it any time.
          </p>
        </div>

        {/* The goal comes first: it is the one decision that makes the app work. */}
        <section className="card mt-5 p-[18px]">
          <div className="flex items-baseline justify-between">
            <label className="text-xs text-muted" htmlFor="daily_goal">
              Daily spending goal
            </label>
            <select
              name="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              aria-label="Currency"
              className="cursor-pointer bg-transparent text-xs text-muted outline-none focus:text-brand"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="mt-2.5 flex items-center gap-2.5 rounded-field border border-brand bg-surface-2 px-3.5 py-3">
            <span className="text-[15px] font-semibold text-muted">
              {currencySymbol(currency)}
            </span>
            <input
              ref={goalRef}
              id="daily_goal"
              name="daily_goal"
              type="text"
              inputMode="decimal"
              required
              defaultValue="200"
              className="w-full bg-transparent text-[1.75rem] font-bold tracking-tight tabular-nums outline-none"
            />
          </div>

          <div className="mt-3 flex gap-2">
            {QUICK_PICKS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  if (goalRef.current) goalRef.current.value = v;
                }}
                className="flex-1 cursor-pointer rounded-full border border-border bg-surface-2 py-2 text-[13px] font-medium text-muted transition-colors hover:text-text"
              >
                {v}
              </button>
            ))}
          </div>
        </section>

        <div className="mt-4 flex flex-col gap-3">
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
        </div>

        {state?.error && (
          <p className="mt-3 text-sm text-over" role="alert">{state.error}</p>
        )}

        {/* Never pre-ticked, and sitting directly above the button that acts
            on it: a box you did not tick is not consent. */}
        <label className="mt-4 flex cursor-pointer items-start gap-3">
          <input
            name="accept_terms"
            type="checkbox"
            required
            className="mt-0.5 size-[22px] shrink-0 cursor-pointer accent-[var(--brand)]"
          />
          <span className="text-[13px] leading-relaxed text-muted">
            I agree to traco&rsquo;s{' '}
            <Link href="/terms" className="font-medium text-brand hover:underline">
              Terms &amp; Conditions
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="font-medium text-brand hover:underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        <button type="submit" disabled={isPending} className="btn btn-primary mt-4 !py-3.5">
          {isPending ? <Spinner size={18} label="Creating account" /> : 'Create account'}
        </button>

        <div className="flex-1" />

        <p className="pt-6 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link href="/auth/sign-in" className="font-semibold text-brand hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
