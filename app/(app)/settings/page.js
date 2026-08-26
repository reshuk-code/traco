import SettingsForm from './settings-form';
import { requireUser, getSettings } from '@/lib/data';
import { sql } from '@/lib/db';
import { formatMoney } from '@/lib/money';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Settings · traco' };

export default async function SettingsPage() {
  const user = await requireUser();
  const settings = await getSettings(user.id);

  const goalChanges = await sql`
    select id, daily_goal_cents, effective_from::text as effective_from
    from public.goal_history
    where user_id = ${user.id}
    order by effective_from desc, created_at desc
    limit 20
  `;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Change your name, your daily goal, and how your days are counted.
        </p>
      </div>

      <section className="card p-5 sm:p-6">
        <SettingsForm user={user} settings={settings} />
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="text-sm font-semibold">Account</h2>
        <p className="mt-2 text-sm text-muted">
          Signed in as <span className="text-text">{user.email}</span>
        </p>
      </section>

      {goalChanges.length > 0 && (
        <section className="card p-5 sm:p-6">
          <h2 className="text-sm font-semibold">Goal changes</h2>
          <p className="mt-1 text-xs text-muted">
            Past days are compared against the goal that was set at the time.
          </p>
          <ul className="mt-3 divide-y divide-border">
            {goalChanges.map((g) => (
              <li key={g.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-muted">
                  from{' '}
                  {new Date(`${g.effective_from}T00:00:00`).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
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
    </div>
  );
}
