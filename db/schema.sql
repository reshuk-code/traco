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
