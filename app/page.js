import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/data';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'traco — the budget that grows when you don’t spend it',
  description:
    'Set a daily limit. Whatever you don’t spend is added to tomorrow — so an easy day actually pays off.',
};

/** A day in the rollover strip: the whole idea of the app, in three rows. */
function Day({ label, amount, spent, carry, lead }) {
  return (
    <div className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
      <span
        className={`w-9 shrink-0 text-xs font-semibold ${lead ? 'text-brand' : 'text-muted'}`}
      >
        {label}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={`font-bold tracking-tight tabular-nums ${
            lead ? 'text-[1.625rem] lg:text-[2.125rem]' : 'text-xl lg:text-2xl'
          }`}
        >
          {amount}
        </p>
        <p className="mt-0.5 text-xs text-muted">{spent}</p>
      </div>
      {carry && (
        <span className="text-[13px] font-semibold" style={{ color: 'var(--good)' }}>
          {carry} →
        </span>
      )}
    </div>
  );
}

function RolloverStrip() {
  return (
    <div className="card divide-y divide-border px-[18px] py-1.5 lg:px-6 lg:py-2">
      <Day label="MON" amount="Rs 200" spent="spent 50" carry="+150" />
      <Day label="TUE" amount="Rs 350" spent="spent 50" carry="+300" />
      <Day label="WED" amount="Rs 500" spent="to spend today" lead />
    </div>
  );
}

const POINTS = [
  {
    title: 'Saving compounds',
    body: 'Every rupee you don’t spend today widens tomorrow’s limit. Overspending never carries forward as debt.',
  },
  {
    title: 'Log it anywhere',
    body: 'No signal needed. Entries save on your device and sync themselves when you’re back online.',
  },
  {
    title: 'Every day on record',
    body: 'A full history of what you spent, with each expense listed under the day it belongs to.',
  },
];

export default async function Home() {
  const user = await getUser();
  if (user) redirect('/dashboard');

  return (
    <main className="flex-1">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 lg:px-12 lg:py-5">
        <span className="text-[17px] font-bold tracking-tight lg:text-[19px]">traco</span>
        <div className="flex items-center gap-4 lg:gap-6">
          <Link
            href="/download"
            className="hidden text-sm font-medium text-muted hover:text-text sm:inline"
          >
            Install the app
          </Link>
          <Link href="/auth/sign-in" className="text-sm font-medium text-muted hover:text-text">
            Sign in
          </Link>
          <Link href="/auth/sign-up" className="btn btn-primary hidden !px-[18px] !py-2 !text-sm lg:inline-flex">
            Create an account
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-5 lg:px-12">
        <section className="grid items-center gap-8 pt-7 lg:grid-cols-2 lg:gap-18 lg:pt-19">
          <div>
            <h1 className="text-[2rem] font-bold leading-[1.12] tracking-tight sm:text-5xl lg:text-[3.5rem] lg:leading-[1.06]">
              The budget that grows when you don&rsquo;t spend it.
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted lg:mt-6 lg:text-lg">
              Set a daily limit. Whatever you don&rsquo;t spend is added to tomorrow
              &mdash; so an easy day actually pays off.
            </p>

            {/* On mobile the strip belongs here, between the pitch and the action. */}
            <div className="mt-7 lg:hidden">
              <RolloverStrip />
              <p className="mt-3.5 text-[13px] leading-relaxed text-muted">
                Go over on a day and only that day takes the hit &mdash; tomorrow
                starts fresh.
              </p>
            </div>

            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row lg:mt-9">
              <Link href="/auth/sign-up" className="btn btn-primary !py-3.5 sm:!px-7 sm:!py-3">
                Create an account
              </Link>
              <Link href="/download" className="btn btn-ghost !py-3.5 sm:!px-7 sm:!py-3">
                Install the app
              </Link>
            </div>

            <div className="mt-5 flex items-center justify-center gap-2.5 text-[13px] text-muted sm:justify-start">
              <span>Free</span>
              <span className="text-border">·</span>
              <span>Works offline</span>
              <span className="text-border">·</span>
              <span>No app store</span>
            </div>
          </div>

          <div className="hidden lg:block">
            <RolloverStrip />
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Go over on a day and only that day takes the hit &mdash; tomorrow
              starts fresh.
            </p>
          </div>
        </section>

        <section className="grid gap-8 pt-16 lg:grid-cols-3 lg:gap-7 lg:pt-24">
          {POINTS.map((p) => (
            <div key={p.title}>
              <h2 className="text-[17px] font-semibold">{p.title}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{p.body}</p>
            </div>
          ))}
        </section>

        <footer className="mt-16 flex flex-col gap-2 border-t border-border py-9 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between lg:mt-24">
          <span>traco</span>
          <span>Set a goal. Keep what you save.</span>
        </footer>
      </div>
    </main>
  );
}
