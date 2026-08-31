import { sql } from '@/lib/db';
import { loadLedger, getActiveChallenge } from '@/lib/data';
import { evaluateChallenge } from '@/lib/challenge';
import { formatMoney } from '@/lib/money';
import { hashWidgetToken } from '@/lib/widget-token';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATE_LABEL = {
  on_track: 'on track',
  at_risk: 'over cap',
  failed: 'broken',
  complete: 'done',
};

/**
 * Everything the home-screen widget draws, in one request.
 *
 * Authenticated by a bearer token rather than a session, because a widget runs
 * outside the app's WebView. Preformatted strings are included alongside the
 * raw numbers so the native side never has to reimplement currency handling.
 */
export async function GET(request) {
  // A header is the right way to send this. A query parameter is also accepted
  // because most home-screen widget apps can only fetch a plain URL and cannot
  // set headers — without it the token is unusable outside a custom APK.
  //
  // The trade-off is real: a token in a URL ends up in server access logs. It is
  // read-only, scoped to one summary, and revocable from Settings, which is what
  // makes that acceptable here.
  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ')
    ? header.slice(7).trim()
    : (new URL(request.url).searchParams.get('token') ?? '').trim();

  if (!token) {
    return Response.json({ error: 'Missing token' }, { status: 401 });
  }

  const rows = await sql`
    select t.id as token_id, t.user_id,
           s.daily_goal_cents, s.currency, s.timezone, s.rollover_enabled
    from public.widget_tokens t
    join public.user_settings s on s.user_id = t.user_id
    where t.token_hash = ${hashWidgetToken(token)}
    limit 1
  `;
  const account = rows[0];
  if (!account) {
    return Response.json({ error: 'Unknown token' }, { status: 401 });
  }

  const todayRows = await sql`
    select (now() at time zone ${account.timezone})::date::text as today
  `;
  const today = todayRows[0].today;

  const [ledger, challenge] = await Promise.all([
    loadLedger(account.user_id, account, today),
    getActiveChallenge(account.user_id),
  ]);

  const day = ledger.at(-1);
  const leftCents = day.allowanceCents - day.spent_cents;
  const currency = account.currency;

  let challengeOut = null;
  if (challenge) {
    const days = ledger
      .filter((d) => d.day >= challenge.starts_on && d.day <= challenge.ends_on)
      .map((d) => ({ day: d.day, base_cents: d.base_cents, spent_cents: d.spent_cents }));
    const r = evaluateChallenge(challenge, days, today);
    if (r) {
      challengeOut = {
        capCents: r.capCents,
        daysElapsed: Math.min(r.daysElapsed, r.daysTotal),
        daysTotal: r.daysTotal,
        slipsLeft: r.slipsLeft,
        state: r.state,
        display: `Day ${Math.min(r.daysElapsed, r.daysTotal)}/${r.daysTotal} · ${
          STATE_LABEL[r.state]
        }`,
      };
    }
  }

  // Best-effort: a failed touch must never cost the caller its data.
  sql`update public.widget_tokens set last_used_at = now() where id = ${account.token_id}`.catch(
    () => {},
  );

  return Response.json(
    {
      today,
      currency,
      goalCents: day.base_cents,
      allowanceCents: day.allowanceCents,
      spentCents: day.spent_cents,
      leftCents,
      entries: day.entries,
      over: leftCents < 0,
      // Percentage of the day's allowance used, clamped for a progress bar.
      usedPct:
        day.allowanceCents > 0
          ? Math.min(100, Math.round((day.spent_cents / day.allowanceCents) * 100))
          : 100,
      challenge: challengeOut,
      display: {
        headline:
          leftCents < 0
            ? `${formatMoney(-leftCents, currency)} over`
            : `${formatMoney(leftCents, currency)} left`,
        sub: `${formatMoney(day.spent_cents, currency)} of ${formatMoney(
          day.allowanceCents,
          currency,
        )}`,
        challenge: challengeOut?.display ?? null,
      },
    },
    // The widget refreshes on its own schedule; never let a CDN answer for it.
    { headers: { 'cache-control': 'no-store' } },
  );
}
