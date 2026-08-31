import DetailHeader from '@/app/components/detail-header';
import { requireUser, getSettings } from '@/lib/data';
import { sql } from '@/lib/db';
import { formatMoney } from '@/lib/money';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Goal changes · traco' };

export default async function GoalsPage() {
  const user = await requireUser();
  const settings = await getSettings(user.id);
  const changes = await sql`
    select distinct on (effective_from)
           id, daily_goal_cents::float8 as daily_goal_cents,
           effective_from::text as effective_from
    from public.goal_history
    where user_id = ${user.id}
    order by effective_from desc, created_at desc
    limit 50
  `;

  return (
    <>
      <DetailHeader title="Goal changes" />
      <div className="mx-auto flex max-w-2xl flex-col gap-3.5 px-5 py-4">
        <section className="card p-[18px]">
          <p className="text-[13px] leading-relaxed text-muted">
            Past days keep the goal that applied at the time, so lowering your goal
            today never turns an old good day into a bad one.
          </p>
          <ul className="mt-3 divide-y divide-border border-t border-border">
            {changes.map((g) => (
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
      </div>
    </>
  );
}
