import PageHeader from '@/app/components/page-header';
import ChallengeCard from '@/app/components/challenge-card';
import ChallengeForm from './challenge-form';
import { endChallenge } from '@/app/actions/challenges';
import {
  requireUser,
  getSettings,
  getToday,
  loadLedger,
  getActiveChallenge,
  getChallengeHistory,
  getCategoryTotals,
} from '@/lib/data';
import { topCategory } from '@/lib/challenge';
import { formatMoney } from '@/lib/money';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Challenge · traco' };

const INSIGHT_WINDOW_DAYS = 30;

// How far back the window picker may reach, which is also how much day data the
// form is handed to add up.
const MAX_LOOKBACK_DAYS = 365;

function daysBefore(day, n) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

const PAST_STATUS = {
  completed: { label: 'Completed', color: 'var(--good)' },
  failed: { label: 'Broken', color: 'var(--over)' },
  abandoned: { label: 'Ended early', color: 'var(--muted)' },
};

export default async function ChallengesPage() {
  const user = await requireUser();
  const settings = await getSettings(user.id);
  const today = await getToday(settings.timezone);

  const [ledger, challenge, history, categories] = await Promise.all([
    loadLedger(user.id, settings, today),
    getActiveChallenge(user.id),
    getChallengeHistory(user.id),
    getCategoryTotals(user.id, daysBefore(today, INSIGHT_WINDOW_DAYS - 1), today),
  ]);

  const top = topCategory(categories);

  // Which window to count is the user's call, so the server hands over the days
  // and lets the form total them — no round trip each time the date moves.
  const lookback = ledger.slice(-MAX_LOOKBACK_DAYS);
  const overspendDays = lookback.map((d) => ({ day: d.day, overByCents: d.overByCents }));

  const challengeDays = challenge
    ? ledger
        .filter((d) => d.day >= challenge.starts_on && d.day <= challenge.ends_on)
        .map((d) => ({ day: d.day, base_cents: d.base_cents, spent_cents: d.spent_cents }))
    : null;

  return (
    <>
      <PageHeader
        title="Challenge"
        subtitle={challenge ? 'One running' : 'Nothing running'}
      />

      <div className="mx-auto flex max-w-2xl flex-col gap-3.5 px-5 py-4">
        {challenge ? (
          <>
            <ChallengeCard
              challenge={challenge}
              challengeDays={challengeDays}
              today={today}
              currency={settings.currency}
              detailed
            />

            <form action={endChallenge} className="px-0.5">
              <input type="hidden" name="id" value={challenge.id} />
              <button
                type="submit"
                className="cursor-pointer text-[13px] font-semibold text-over hover:underline"
              >
                End this challenge
              </button>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                The days you already finished keep their result. Nothing in your
                history changes.
              </p>
            </form>
          </>
        ) : (
          <ChallengeForm
            days={overspendDays}
            goalCents={settings.daily_goal_cents}
            currency={settings.currency}
            today={today}
            earliest={lookback[0]?.day ?? today}
          />
        )}

        {top && (
          <section className="card p-[18px]">
            <h2 className="text-[13px] font-semibold">Where it goes</h2>
            <div className="mt-3 flex items-baseline justify-between gap-3">
              <span className="text-[15px] font-semibold capitalize">{top.category}</span>
              <span className="text-[15px] font-bold tabular-nums">
                {formatMoney(top.cents, settings.currency)}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-track">
              <div
                className="h-full rounded-full"
                style={{ width: `${top.pct}%`, background: 'var(--brand)' }}
              />
            </div>
            <p className="mt-2.5 text-[13px] leading-relaxed text-muted">
              That&apos;s {Math.round(top.pct)}% of everything you logged in the last{' '}
              {INSIGHT_WINDOW_DAYS} days, across {top.entries}{' '}
              {top.entries === 1 ? 'entry' : 'entries'}. It&apos;s the one place a
              small change moves the most money.
            </p>
          </section>
        )}

        {history.length > 0 && (
          <section className="card p-[18px]">
            <h2 className="text-[13px] font-semibold">Past challenges</h2>
            <ul className="mt-2.5 divide-y divide-border border-t border-border">
              {history.map((h) => {
                const status = PAST_STATUS[h.status] ?? PAST_STATUS.abandoned;
                return (
                  <li key={h.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium">
                        {h.cap_cents === 0
                          ? 'Spend nothing'
                          : `Under ${formatMoney(h.cap_cents, settings.currency)} a day`}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted">
                        from{' '}
                        {new Date(`${h.starts_on}T00:00:00`).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <span
                      className="shrink-0 text-[11px] font-semibold"
                      style={{ color: status.color }}
                    >
                      {status.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
