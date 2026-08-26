import TodayView from '@/app/components/today-view';
import OfflineNotice from '@/app/components/offline-notice';
import WeekChart from '@/app/components/week-chart';
import { isConnectivityError } from '@/lib/db';
import { requireUser, getSettings, getToday, getExpensesForDay, loadLedger } from '@/lib/data';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Today · traco' };

export default async function DashboardPage() {
  const user = await requireUser();

  let settings;
  let today;
  let ledger;
  let todayExpenses;

  try {
    settings = await getSettings(user.id);
    today = await getToday(settings.timezone);
    [ledger, todayExpenses] = await Promise.all([
      loadLedger(user.id, settings, today),
      getExpensesForDay(user.id, today),
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
  const prettyDate = new Date(`${today}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hi {user.name.split(' ')[0]}</h1>
        <p className="mt-1 text-sm text-muted">{prettyDate}</p>
      </div>

      <TodayView
        day={currentDay}
        expenses={todayExpenses}
        today={today}
        currency={settings.currency}
        rollover={settings.rollover_enabled}
      />

      <section className="card p-5 sm:p-6">
        <WeekChart days={ledger.slice(-7)} currency={settings.currency} />
      </section>
    </div>
  );
}
