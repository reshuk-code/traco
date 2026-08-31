-- traco schema
--
-- Run this against a Neon branch that already has Neon Auth provisioned, which
-- is what creates the `neon_auth` schema these tables point at.
--
--   psql "$DATABASE_URL" -f db/schema.sql

-- One row per user: the current goal and how their days are counted.
create table if not exists public.user_settings (
  user_id          uuid primary key references neon_auth."user"(id) on delete cascade,
  daily_goal_cents integer     not null default 40000 check (daily_goal_cents >= 0),
  currency         text        not null default 'NPR',
  timezone         text        not null default 'UTC',
  rollover_enabled boolean     not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Every logged expense. `id` is supplied by the client for entries created
-- offline, so replaying the sync queue cannot create duplicates.
create table if not exists public.expenses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid        not null references neon_auth."user"(id) on delete cascade,
  amount_cents integer     not null check (amount_cents > 0),
  category     text        not null default 'other',
  note         text,
  spent_on     date        not null,
  created_at   timestamptz not null default now()
);

create index if not exists expenses_user_day_idx
  on public.expenses (user_id, spent_on desc, created_at desc);

-- Goal changes are versioned so a past day is always judged against the goal
-- that was actually in force on that day.
create table if not exists public.goal_history (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid        not null references neon_auth."user"(id) on delete cascade,
  daily_goal_cents integer     not null check (daily_goal_cents >= 0),
  effective_from   date        not null,
  created_at       timestamptz not null default now()
);

create index if not exists goal_history_user_idx
  on public.goal_history (user_id, effective_from desc);

-- A self-imposed cap the user opts into: "stay under X a day for N days".
--
-- Challenges never change the budget maths in `buildLedger` — they are read
-- alongside the ledger and judged against it. That is what keeps a challenge
-- from retroactively re-scoring days once it ends, and it is why every user can
-- have a different challenge without a line of user-specific code: the rule is
-- one function, the parameters are these rows.
--
-- `completed` and `failed` are derived from the ledger on every read, never
-- written on a schedule. Only `abandoned` is stored, because quitting is a
-- choice the data cannot imply.
create table if not exists public.challenges (
  id            uuid    primary key default gen_random_uuid(),
  user_id       uuid    not null references neon_auth."user"(id) on delete cascade,
  kind          text    not null default 'spend_under',
  cap_cents     integer not null check (cap_cents >= 0),
  starts_on     date    not null,
  ends_on       date    not null,
  allowed_slips integer not null default 2 check (allowed_slips >= 0),
  -- The overspend this challenge was sized to claw back, if it was suggested.
  target_cents  integer check (target_cents is null or target_cents >= 0),
  status        text    not null default 'active'
                  check (status in ('active', 'completed', 'failed', 'abandoned')),
  ended_on      date,
  created_at    timestamptz not null default now(),
  check (ends_on >= starts_on)
);

-- At most one challenge running at a time, enforced by the database rather than
-- by a check the application could race past.
create unique index if not exists challenges_one_active_idx
  on public.challenges (user_id) where status = 'active';

create index if not exists challenges_user_idx
  on public.challenges (user_id, starts_on desc);

-- One row per device that has agreed to a daily reminder. The endpoint is the
-- push service URL the browser hands us; it is the identity of the device, so a
-- re-subscribe on the same device replaces rather than duplicates.
--
-- `last_sent_on` holds the user's LOCAL day, which is what makes the sender
-- idempotent: an hourly cron, a retry, or a redeploy cannot send twice in a day.
create table if not exists public.push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid        not null references neon_auth."user"(id) on delete cascade,
  endpoint     text        not null unique,
  p256dh       text        not null,
  auth         text        not null,
  last_sent_on date,
  created_at   timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions (user_id);

-- The hour, in the user's own timezone, to send the reminder. Null means off,
-- which is the default: nobody gets notified without asking for it.
alter table public.user_settings
  add column if not exists reminder_hour integer
    check (reminder_hour is null or (reminder_hour between 0 and 23));

-- Tokens for the Android home-screen widget.
--
-- A widget is native code living outside the app's WebView, so it has no
-- session cookie to lean on. It carries a bearer token instead. Only the SHA-256
-- hash is stored: the raw token is shown to the user once, at creation, and
-- cannot be recovered here — a leaked database therefore grants nothing.
create table if not exists public.widget_tokens (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid        not null references neon_auth."user"(id) on delete cascade,
  token_hash   text        not null unique,
  label        text        not null default 'Android widget',
  last_used_at timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists widget_tokens_user_idx
  on public.widget_tokens (user_id, created_at desc);
