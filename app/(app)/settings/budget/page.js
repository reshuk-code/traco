import DetailHeader from '@/app/components/detail-header';
import BudgetForm from './budget-form';
import { requireUser, getSettings, getToday, loadLedger } from '@/lib/data';
import { summarize } from '@/lib/budget';
import { formatMoney } from '@/lib/money';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Daily budget · traco' };

export default async function BudgetPage() {
  const user = await requireUser();
  const settings = await getSettings(user.id);
  const today = await getToday(settings.timezone);
  const ledger = await loadLedger(user.id, settings, today);

  // Context for the goal field: what they actually spend, not what they hoped to.
  const stats = summarize(ledger);
  const averageLabel =
    stats.daysWithSpending > 0
      ? `You're averaging ${formatMoney(
          Math.round(stats.spentCents / stats.daysWithSpending),
          settings.currency,
        )} a day over the last ${stats.daysWithSpending} ${
          stats.daysWithSpending === 1 ? 'day' : 'days'
        }.`
      : null;

  return (
    <>
      <DetailHeader title="Daily budget" />
      <div className="mx-auto max-w-2xl px-5 py-4">
        {/* Keyed on the saved values: React resets an uncontrolled form after
            its action runs, back to the defaultValue captured at mount, so a
            saved goal would snap to the old number and re-save it. */}
        <BudgetForm
          key={`${settings.daily_goal_cents}:${settings.currency}:${settings.rollover_enabled}`}
          settings={settings}
          averageLabel={averageLabel}
        />
      </div>
    </>
  );
}
