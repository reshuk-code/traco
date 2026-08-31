import PageHeader from '@/app/components/page-header';
import SignOutButton from '@/app/components/sign-out-button';
import SettingsForm from './settings-form';
import ReminderToggle from '@/app/components/reminder-toggle';
import WidgetTokenCard from '@/app/components/widget-token-card';
import { requireUser, getSettings, getToday, loadLedger } from '@/lib/data';
import { summarize } from '@/lib/budget';
import { sql } from '@/lib/db';
import { formatMoney } from '@/lib/money';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Settings · traco' };

export default async function SettingsPage() {
  const user = await requireUser();
  const settings = await getSettings(user.id);
  const today = await getToday(settings.timezone);

  const [ledger, goalChanges, reminder, widgetTokens] = await Promise.all([
    loadLedger(user.id, settings, today),
    sql`
      select distinct on (effective_from)
             id, daily_goal_cents, effective_from::text as effective_from
      from public.goal_history
      where user_id = ${user.id}
      order by effective_from desc, created_at desc
      limit 20
    `,
    sql`select reminder_hour from public.user_settings where user_id = ${user.id}`,
    sql`
      select id, label, created_at, last_used_at
      from public.widget_tokens
      where user_id = ${user.id}
      order by created_at desc
    `,
  ]);

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
      <PageHeader title="Settings" />

      <div className="mx-auto flex max-w-2xl flex-col gap-3.5 px-5 py-4">
        {/*
          React resets an uncontrolled form after its action runs, back to the
          defaultValue captured when the input mounted — so a saved goal would
          snap back to the old number, and saving again would write that stale
          value. Keying on the saved values remounts the form with fresh ones.
        */}
        <SettingsForm
          key={`${settings.daily_goal_cents}:${settings.currency}:${settings.timezone}:${settings.rollover_enabled}:${user.name}`}
          user={user}
          settings={settings}
          averageLabel={averageLabel}
        />

        <ReminderToggle
          reminderHour={reminder[0]?.reminder_hour ?? null}
          publicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY}
          timezone={settings.timezone}
        />

        <WidgetTokenCard tokens={widgetTokens} siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? ''} />

        {goalChanges.length > 0 && (
          <section className="card p-[18px]">
            <h2 className="text-[13px] font-semibold">Goal changes</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Past days keep the goal that applied at the time.
            </p>
            <ul className="mt-2.5 divide-y divide-border border-t border-border">
              {goalChanges.map((g) => (
                <li key={g.id} className="flex items-center justify-between py-3 text-[13px]">
                  <span className="text-muted">
                    from{' '}
                    {new Date(`${g.effective_from}T00:00:00`).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {formatMoney(g.daily_goal_cents, settings.currency)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="flex items-center justify-between gap-4 px-0.5 py-1">
          <span className="min-w-0 truncate text-[13px] text-muted">{user.email}</span>
          <SignOutButton />
        </div>
      </div>
    </>
  );
}
