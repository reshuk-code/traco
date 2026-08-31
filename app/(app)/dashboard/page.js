import Link from 'next/link';
import PageHeader from '@/app/components/page-header';
import TodayView from '@/app/components/today-view';
import OfflineNotice from '@/app/components/offline-notice';
import WeekChart from '@/app/components/week-chart';
import ChallengeCard from '@/app/components/challenge-card';
import { isConnectivityError } from '@/lib/db';
import {
  requireUser,
  getSettings,
  getToday,
  getExpensesForDay,
  loadLedger,
  getActiveChallenge,
} from '@/lib/data';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Today · traco' };

export default async function DashboardPage() {
  const user = await requireUser();

  let settings;
  let today;
  let ledger;
  let todayExpenses;
  let challenge;

  try {
    settings = await getSettings(user.id);
    today = await getToday(settings.timezone);
    [ledger, todayExpenses, challenge] = await Promise.all([
      loadLedger(user.id, settings, today),
      getExpensesForDay(user.id, today),
      getActiveChallenge(user.id),
    ]);
  } catch (error) {
    if (!isConnectivityError(error)) throw error;
    // The database is unreachable, but the browser is still running the app.
    // Fall back to a view that can only log, not report.
    return (
      <OfflineNotice
        today={new Date().toISOString().slice(0, 10)}
        currency={settings?.currency ?? 'NPR'}
      />
    );
  }

  const currentDay = ledger.at(-1);

  // Only the slice the challenge covers goes to the client, which then folds in
  // the outbox and evaluates. Three fields per day is all the evaluator reads.
  const challengeDays = challenge
    ? ledger
        .filter((d) => d.day >= challenge.starts_on && d.day <= challenge.ends_on)
        .map((d) => ({ day: d.day, base_cents: d.base_cents, spent_cents: d.spent_cents }))
    : null;

  const prettyDate = new Date(`${today}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const initial = user.name.trim().charAt(0).toUpperCase() || '?';

  return (
    <>
      <PageHeader
        title="Today"
        subtitle={prettyDate}
        action={
          <Link
            href="/settings"
            aria-label="Your account"
            className="flex size-[34px] items-center justify-center rounded-full border border-border bg-surface-2 text-[13px] font-semibold text-muted hover:text-text"
          >
            {initial}
          </Link>
        }
      />

      <div className="mx-auto flex max-w-2xl flex-col gap-3.5 px-5 py-4">
        <TodayView
          day={currentDay}
          expenses={todayExpenses}
          today={today}
          currency={settings.currency}
          rollover={settings.rollover_enabled}
          challengeSlot={
            challenge ? (
              <ChallengeCard
                challenge={challenge}
                challengeDays={challengeDays}
                today={today}
                currency={settings.currency}
              />
            ) : null
          }
        />

        <section className="card p-[18px]">
          <WeekChart days={ledger.slice(-7)} currency={settings.currency} />
        </section>
      </div>
    </>
  );
}
