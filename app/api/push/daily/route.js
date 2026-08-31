import webpush from 'web-push';
import { sql } from '@/lib/db';
import { loadLedger, getActiveChallenge } from '@/lib/data';
import { evaluateChallenge } from '@/lib/challenge';
import { formatMoney } from '@/lib/money';
import { safeEqual } from '@/lib/widget-token';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const STATE_LABEL = {
  on_track: 'on track',
  at_risk: 'over the cap today',
  failed: 'broken',
  complete: 'finished',
};

/**
 * The daily reminder.
 *
 * Runs on a schedule and sends to each user at *their* local hour, which is why
 * it is safe to fire this hourly: a user is only due when the hour in their own
 * timezone matches the one they picked, and `last_sent_on` holds their local
 * day, so a retry or a second run cannot notify twice.
 */
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  const presented = request.headers.get('authorization') ?? '';
  if (!secret || !safeEqual(presented, `Bearer ${secret}`)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    return Response.json({ error: 'VAPID keys are not configured' }, { status: 500 });
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:noreply@example.com',
    publicKey,
    privateKey,
  );

  // Due = the user's own clock has reached the hour they chose.
  const candidates = await sql`
    select u.user_id, u.daily_goal_cents::float8 as daily_goal_cents, u.currency, u.timezone,
           u.rollover_enabled, u.reminder_hour
    from public.user_settings u
    where u.reminder_hour is not null
      and exists (
        select 1 from public.push_subscriptions p where p.user_id = u.user_id
      )
  `;

  // Each timezone is resolved here rather than in one SQL expression spanning
  // every row. A name Postgres rejects threw for the whole query, so one bad
  // setting silently stopped notifications for every other user too.
  let skipped = 0;
  const due = [];

  for (const user of candidates) {
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: user.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        hour12: false,
      }).formatToParts(new Date());

      const at = (type) => parts.find((p) => p.type === type)?.value;
      if (Number(at('hour')) % 24 !== user.reminder_hour) continue;

      due.push({ ...user, local_today: `${at('year')}-${at('month')}-${at('day')}` });
    } catch {
      // An unusable timezone skips one user instead of the whole run.
      skipped++;
    }
  }

  let sent = 0;
  let expired = 0;
  let failed = 0;

  for (const user of due) {
    const subs = await sql`
      select id, endpoint, p256dh, auth
      from public.push_subscriptions
      where user_id = ${user.user_id}
        and (last_sent_on is null or last_sent_on < ${user.local_today}::date)
    `;
    if (subs.length === 0) continue;

    const today = user.local_today;
    const [ledger, challenge] = await Promise.all([
      loadLedger(user.user_id, user, today),
      getActiveChallenge(user.user_id),
    ]);

    const day = ledger.at(-1);
    if (!day) continue;

    const leftCents = day.allowanceCents - day.spent_cents;
    const title =
      leftCents < 0
        ? `${formatMoney(-leftCents, user.currency)} over today`
        : `${formatMoney(leftCents, user.currency)} left today`;

    let body = `Spent ${formatMoney(day.spent_cents, user.currency)} of ${formatMoney(
      day.allowanceCents,
      user.currency,
    )}.`;

    if (challenge) {
      const days = ledger
        .filter((d) => d.day >= challenge.starts_on && d.day <= challenge.ends_on)
        .map((d) => ({ day: d.day, base_cents: d.base_cents, spent_cents: d.spent_cents }));
      const r = evaluateChallenge(challenge, days, today);
      if (r) {
        body = `Day ${Math.min(r.daysElapsed, r.daysTotal)} of ${r.daysTotal} · ${
          STATE_LABEL[r.state]
        } · ${r.slipsLeft} ${r.slipsLeft === 1 ? 'slip' : 'slips'} left`;
      }
    }

    const payload = JSON.stringify({ title, body, url: '/dashboard', tag: 'traco-daily' });

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        );
        await sql`
          update public.push_subscriptions
          set last_sent_on = ${today}::date
          where id = ${sub.id}
        `;
        sent++;
      } catch (error) {
        // 404/410 mean the browser threw the subscription away. Anything else is
        // transient, so leave the row alone and let the next run retry.
        if (error?.statusCode === 404 || error?.statusCode === 410) {
          await sql`delete from public.push_subscriptions where id = ${sub.id}`;
          expired++;
        } else {
          failed++;
        }
      }
    }
  }

  return Response.json({
    candidates: candidates.length,
    due: due.length,
    sent,
    expired,
    failed,
    skipped,
  });
}
