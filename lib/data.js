import { cache } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';
import { buildLedger } from '@/lib/budget';

const DEFAULT_SETTINGS = {
  daily_goal_cents: 40000,
  currency: 'NPR',
  timezone: 'UTC',
  rollover_enabled: true,
};

/** Session lookup is memoized per request so layouts and pages share one call. */
export const getUser = cache(async () => {
  const { data: session } = await auth.getSession();
  return session?.user ?? null;
});

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect('/auth/sign-in');
  return user;
}

/**
 * Every user gets a settings row on first read, so the rest of the app can
 * assume a goal, a currency and a timezone always exist.
 */
export const getSettings = cache(async (userId) => {
  const rows = await sql`
    insert into public.user_settings (user_id, daily_goal_cents, currency, timezone)
    values (${userId}, ${DEFAULT_SETTINGS.daily_goal_cents}, ${DEFAULT_SETTINGS.currency}, ${DEFAULT_SETTINGS.timezone})
    on conflict (user_id) do update set user_id = excluded.user_id
    returning daily_goal_cents, currency, timezone, rollover_enabled
  `;
  return rows[0] ?? DEFAULT_SETTINGS;
});

/** "Today" is the user's local day, not the server's UTC day. */
export async function getToday(timezone) {
  const rows = await sql`select (now() at time zone ${timezone})::date::text as today`;
  return rows[0].today;
}

export async function getDayTotal(userId, day) {
  const rows = await sql`
    select coalesce(sum(amount_cents), 0)::int as total_cents, count(*)::int as entries
    from public.expenses
    where user_id = ${userId} and spent_on = ${day}
  `;
  return rows[0];
}

export async function getExpensesForDay(userId, day) {
  return sql`
    select id, amount_cents, category, note, spent_on::text as spent_on, created_at
    from public.expenses
    where user_id = ${userId} and spent_on = ${day}
    order by created_at desc
  `;
}

/**
 * The first day this account has anything to say about: the earliest goal or
 * the earliest expense, whichever came first.
 */
export async function getTrackingStart(userId, today) {
  const rows = await sql`
    select least(
      (select min(effective_from) from public.goal_history where user_id = ${userId}),
      (select min(spent_on) from public.expenses where user_id = ${userId}),
      ${today}::date
    )::text as start_day
  `;
  return rows[0].start_day;
}

/**
 * One row per calendar day between `from` and `to`, including days with nothing
 * logged — with rollover those still add their goal to the balance.
 *
 * `base_cents` is the goal that was in force on that day, falling back to the
 * earliest recorded goal for days that predate any goal change.
 */
export async function getDaySeries(userId, from, to, fallbackGoalCents) {
  return sql`
    select
      d::date::text as day,
      coalesce(
        (
          select g.daily_goal_cents from public.goal_history g
          where g.user_id = ${userId} and g.effective_from <= d::date
          order by g.effective_from desc, g.created_at desc limit 1
        ),
        (
          select g.daily_goal_cents from public.goal_history g
          where g.user_id = ${userId}
          order by g.effective_from asc, g.created_at asc limit 1
        ),
        ${fallbackGoalCents}
      )::int as base_cents,
      coalesce((
        select sum(e.amount_cents) from public.expenses e
        where e.user_id = ${userId} and e.spent_on = d::date
      ), 0)::int as spent_cents,
      coalesce((
        select count(*) from public.expenses e
        where e.user_id = ${userId} and e.spent_on = d::date
      ), 0)::int as entries
    from generate_series(${from}::date, ${to}::date, interval '1 day') d
    order by d
  `;
}

/** The flat log: every expense the user has ever recorded. */
export async function getAllExpenses(userId, limit = 500) {
  return sql`
    select id, amount_cents, category, note, spent_on::text as spent_on, created_at
    from public.expenses
    where user_id = ${userId}
    order by spent_on desc, created_at desc
    limit ${limit}
  `;
}

export async function getTotals(userId) {
  const rows = await sql`
    select
      coalesce(sum(amount_cents), 0)::int as total_cents,
      count(*)::int as entries,
      count(distinct spent_on)::int as days
    from public.expenses
    where user_id = ${userId}
  `;
  return rows[0];
}

/** The full day-by-day ledger from the first tracked day through today. */
export async function loadLedger(userId, settings, today) {
  const start = await getTrackingStart(userId, today);
  const series = await getDaySeries(userId, start, today, settings.daily_goal_cents);
  return buildLedger(series, settings.rollover_enabled);
}

/**
 * The challenge currently running, if any. Memoized because the dashboard and
 * the challenges screen both ask for it in the same render.
 */
export const getActiveChallenge = cache(async (userId) => {
  const rows = await sql`
    select id, kind, cap_cents, starts_on::text as starts_on, ends_on::text as ends_on,
           allowed_slips, target_cents, status, ended_on::text as ended_on
    from public.challenges
    where user_id = ${userId} and status = 'active'
    limit 1
  `;
  return rows[0] ?? null;
});

export async function getChallengeHistory(userId, limit = 20) {
  return sql`
    select id, kind, cap_cents, starts_on::text as starts_on, ends_on::text as ends_on,
           allowed_slips, target_cents, status, ended_on::text as ended_on
    from public.challenges
    where user_id = ${userId} and status <> 'active'
    order by starts_on desc
    limit ${limit}
  `;
}

/** What each category cost over a window, biggest first. */
export async function getCategoryTotals(userId, from, to) {
  return sql`
    select category, sum(amount_cents)::int as cents, count(*)::int as entries
    from public.expenses
    where user_id = ${userId} and spent_on between ${from} and ${to}
    group by category
    order by cents desc
  `;
}
