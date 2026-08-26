# traco

A daily spending tracker. Set a goal for the day, log what you spend, and carry
whatever you didn't spend into tomorrow. Works offline.

Built with Next.js 16 (App Router), Neon Postgres, and Neon Auth.

## What it does

- **Email/password accounts** — sign up with your name and a starting daily goal.
- **Log expenses** with an amount, category, optional note, and date.
- **A rollover budget** — unspent money increases tomorrow's budget (see below).
- **Full history** — every day you tracked, and every expense inside it.
- **Works offline** — install it, log expenses with no connection, and it syncs
  itself when you're back.
- **Your day, not UTC** — day boundaries follow your own timezone.

## How the rollover works

Each day is allocated its goal. Anything left over at the end of the day is
added to the next day's budget:

| Day | Goal | Carried in | Available | Spent | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| 1 | 200 | 0 | **200** | 50 | +150 carries |
| 2 | 200 | 150 | **350** | 50 | +300 carries |
| 3 | 200 | 300 | **500** | 50 | +450 carries |

Overspending does **not** carry. A day where you spend more than you had shows
its own shortfall, then the slate is wiped — the next day starts from its goal
again, and the saved-up balance never goes negative:

| Day | Available | Spent | Result |
| --- | ---: | ---: | --- |
| 1 | **200** | 300 | −100 over today, nothing carried |
| 2 | **200** | 0 | +200 carries — fresh start |

Rollover can be turned off in Settings, which judges every day against its goal
on its own.

Goal changes are versioned in `goal_history`, so a past day is always compared
against the goal that was actually in force on that day — lowering your goal
today never retroactively turns an old good day into a bad one.

## How offline works

Three separate pieces, because they solve different problems:

1. **A service worker** (`public/sw.js`) caches the app shell and pages, so the
   app opens with no network at all. It also makes the app installable to a
   phone home screen.
2. **`experimental.useOffline`** (built into Next.js 16) keeps navigations and
   Server Actions pending instead of throwing when the connection drops, and
   retries them once it returns.
3. **An outbox** (`lib/outbox.js`) holds expenses logged while offline in
   `localStorage`, so they survive a closed tab or a dead battery — which a
   pending Server Action does not.

Each queued entry is given a **client-generated UUID that becomes the database
row's primary key**, and the sync insert uses `on conflict (id) do nothing`.
That is what makes replay safe: a flaky reconnect, or two tabs syncing at once,
cannot double-count anything.

Pending entries appear in the UI marked "waiting to sync" and are counted in the
day's total, so the number on screen is always what you actually spent.

If the server is reachable but the *database* is not, the app degrades instead
of erroring: you still get a working log form, and the entry goes to the outbox.

Signing out clears the cached pages and the outbox from the device.

## Getting started

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) account (the free plan is enough)

### 1. Install

```bash
git clone https://github.com/reshuk-code/traco
cd traco
npm install
```

### 2. Create a Neon project and enable Auth

In the [Neon Console](https://console.neon.tech):

1. Create a project.
2. Go to **Auth** and click **Enable Auth**.
3. Copy the **Auth URL** from the Configuration tab.
4. Copy the **connection string** from Connect.

### 3. Configure the environment

```bash
cp .env.example .env.local
```

Fill in `DATABASE_URL` and `NEON_AUTH_BASE_URL` with the values above, then
generate a cookie secret:

```bash
openssl rand -base64 32
```

### 4. Create the tables

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

No `psql`? Paste the contents of `db/schema.sql` into the Neon Console's SQL
Editor instead.

The tables reference `neon_auth."user"`, so Auth must be enabled first.

### 5. Run it

```bash
npm run dev
```

Open <http://localhost:3000>.

## Testing offline

Offline behavior is only reliable in a production build — the Next.js docs are
explicit that dev mode is not a fair reference:

```bash
npm run build
npm start
```

Then load a page once (so it gets cached), and switch **DevTools → Network →
Offline**, or turn off Wi-Fi. Log an expense, come back online, and watch it
sync.

## Project structure

```
app/
  (app)/              authenticated screens, sharing a header and layout
    dashboard/        today: budget, log form, entries, 7-day chart
    history/          day-by-day ledger, expandable to every expense
    settings/         name, goal, currency, timezone, rollover toggle
  actions/            server actions (expenses, settings)
  api/auth/[...path]/ Neon Auth handler
  auth/               sign-in and sign-up
  components/         UI, including the offline-aware pieces
  manifest.js         PWA manifest
  offline/            fallback page served by the service worker
lib/
  budget.js           rollover ledger maths (pure, no I/O)
  data.js             queries and the session helper
  db.js               Neon client, plus outage-vs-bug error classification
  money.js            minor-unit parsing and formatting
  outbox.js           offline queue
db/schema.sql         database schema
proxy.js              route protection (Next.js 16's replacement for middleware)
public/sw.js          service worker
```

Money is stored as **integer minor units** (paisa/cents), never floats, so sums
and comparisons are exact.

## Notes

- `proxy.js` is Next.js 16's replacement for `middleware.ts`.
- Neon Auth (Managed Better Auth) and `experimental.useOffline` are both
  currently beta/experimental upstream.
- Auth cookies are `Secure`, so sign-in needs HTTPS or `localhost`.
- `AGENTS.md` is generated by `next dev` and is intentionally committed.
