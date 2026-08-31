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
- **A shareable install page** at `/download`, with generated link previews.
- **Challenges** — hold yourself to a stricter daily cap for a stretch of days,
  scored separately from your real budget (see below).
- **A daily reminder** — one push notification with what is left and how the
  challenge is going, so you do not have to open the app to find out.
- **Launcher shortcuts**, and an optional Android home-screen widget.

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

## Challenges

A challenge is a stricter daily cap you opt into — "stay under Rs 100 a day for
25 days" — held for a fixed window and scored on its own.

It **never changes the budget maths**. The Today meter keeps showing your real
goal plus rollover; the challenge reports a second, independent verdict beside
it. The two are allowed to disagree, and that is the point: ending a challenge
can never retroactively re-score days you already lived, which is the same
principle `goal_history` exists to protect.

Because of that separation a challenge is **data, not code**: one row
(`cap_cents`, a window, `allowed_slips`) plus one pure function,
`evaluateChallenge` in `lib/challenge.js`, reading the ledger `buildLedger`
already produces. Every user runs a different challenge with no user-specific
branching anywhere.

Details worth knowing:

- **Recovery is scoped to a window you pick** — the last 2, 3, 7, 14 or 30 days,
  or a specific date. Summing overspend across all history climbs forever and
  names a number no challenge can clear.
- **Slip days** (default 2) mean one bad afternoon does not end a three-week run.
  A challenge fails only when slips *exceed* the allowance.
- **A cap of 0 is a no-spend run** — the same code path, no special case.
- `completed` and `failed` are **derived from the ledger on every read**, never
  written on a schedule, so there is no cron and no write-on-read. Only
  `abandoned` is stored, because quitting is a choice the data cannot imply.
- The challenge card counts anything still in the offline outbox, so a day
  logged with no signal still counts against the cap.

## Daily reminders

One push notification a day, at an hour you choose, in your own timezone:

```
NPR 205.00 left today
Day 3 of 25 · on track · 2 slips left
[ Log an expense ]
```

The cron at `/api/push/daily` runs **hourly** and sends to a user only when the
hour in *their* timezone matches the one they picked — a fixed daily UTC job
would reach everyone at a different local time. `last_sent_on` stores the
user’s **local** day, which is what makes hourly firing safe: a retry, a
redeploy or a duplicate run cannot notify twice.

If your Vercel plan only triggers crons once a day, set the schedule in
`vercel.json` to the single UTC time matching your own timezone instead.

Subscriptions are per **device**, so a phone and a laptop are two rows. Turning
reminders off unsubscribes only the device you are holding; the hour clears once
no device is left listening. Signing out releases that device too.

Expired subscriptions (404/410 from the push service) are deleted on the next
run. Other failures are left alone to retry.

## Home-screen widget

A PWA **cannot** draw an Android home-screen widget — those are
`AppWidgetProvider` + `RemoteViews` inside a real APK, and no web API exposes
them. (The `widgets` member in the manifest spec targets the Windows 11 Widgets
Board, not Android home screens.)

What exists instead:

- **Launcher shortcuts** (`app/manifest.js`) — long-press the icon for Log,
  Today, Challenge and History. Android caches the WebAPK at install time, so
  these appear only after re-adding the app to the home screen.
- **`GET /api/widget/summary`** — everything a widget draws, in one request,
  authenticated by a read-only bearer token generated in Settings. Only the
  token hash is stored; the raw value is shown once. The token may be sent as a
  header *or* as `?token=`, because most widget apps (KWGT, Tasker) can only
  fetch a plain URL — a trade-off documented in the route itself.
- **`android/`** — a Bubblewrap TWA config plus Kotlin widget sources, for
  wrapping traco in a real APK. See `android/README.md`. That scaffold has never
  been compiled.

The endpoint returns preformatted display strings alongside the raw numbers, so
the native side never reimplements currency or rollover logic.

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

For the daily reminder, also generate a Web Push keypair and a cron secret, then
set `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` and
`CRON_SECRET`. Reminders need HTTPS, so they will not fire on localhost.

When you deploy, `metadataBase` resolves the site's public URL in this order:

1. `NEXT_PUBLIC_SITE_URL`, if you set it (use this for a custom domain).
2. `VERCEL_PROJECT_PRODUCTION_URL`, which Vercel injects automatically.
3. `http://localhost:3000`.

So a Vercel deployment emits correct Open Graph URLs with no configuration.

Note that in development the generated OG **image** URLs point at `localhost`
even when a site URL is set — Next.js resolves file-convention images against
the request origin there. A production build uses `metadataBase`, which is what
gets shared.

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

## Installing and sharing

`/download` is a public page (no sign-in) that walks people through installing
the app. It detects the visitor's platform and shows only the steps that apply,
offers a one-tap install where the browser supports it, and has a Share button
that uses the Web Share API, falling back to copying the link.

Link previews are generated at build time with `ImageResponse`:

- `app/opengraph-image.js` — the site-wide preview
- `app/download/opengraph-image.js` — a variant for the install page
- `lib/og-template.js` — the artwork both share

Note that a nested route declaring its own `openGraph` metadata replaces the
parent's, so a route with custom OG metadata needs its own image file — which is
why `/download` has one.

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
    challenges/       start a challenge, track it, past runs
    history/          day-by-day ledger, expandable to every expense
    settings/         goal, currency, timezone, rollover, reminder, widget token
  actions/            server actions (expenses, settings, challenges, push, widget)
  api/auth/[...path]/ Neon Auth handler
  api/push/daily/     hourly reminder sender (cron-authenticated)
  api/widget/summary/ widget feed (bearer-token authenticated)
  api/assetlinks/     Digital Asset Links, rewritten to /.well-known/
  auth/               sign-in and sign-up
  components/         UI, including the offline-aware pieces
  download/           public install page, platform-aware steps, OG image
  manifest.js         PWA manifest
  offline/            fallback page served by the service worker
  opengraph-image.js  generated link preview
lib/
  budget.js           rollover ledger maths (pure, no I/O)
  challenge.js        challenge evaluation and presets (pure, no I/O)
  timezone.js         IANA name validation, before it can reach Postgres
  push.js             browser push subscription helpers
  widget-token.js     widget token hashing, constant-time compare
  og-template.js      shared Open Graph artwork
  data.js             queries and the session helper
  db.js               Neon client, plus outage-vs-bug error classification
  money.js            minor-unit parsing and formatting
  outbox.js           offline queue
db/schema.sql         database schema
android/              TWA config + Kotlin home-screen widget (uncompiled)
proxy.js              route protection (Next.js 16's replacement for middleware)
public/sw.js          service worker: offline shell, push, notification clicks
vercel.json           cron schedule for the daily reminder
```

Money is stored as **integer minor units** (paisa/cents), never floats, so sums
and comparisons are exact.

## Notes

- `proxy.js` is Next.js 16's replacement for `middleware.ts`.
- Neon Auth (Managed Better Auth) and `experimental.useOffline` are both
  currently beta/experimental upstream.
- Auth cookies are `Secure`, so sign-in needs HTTPS or `localhost`.
- `AGENTS.md` is generated by `next dev` and is intentionally committed.
- The service worker is registered in development too, as `/sw.js?dev=1`, which
  makes it skip caching entirely. Push needs a worker, and dev must not get a
  cache-first one. Keying that on the registration URL rather than the hostname
  keeps `npm start` on localhost a fair offline test.
- Timezone names are validated before they reach the database — Postgres raises
  on a name it does not know, and that error is not contained. See
  `lib/timezone.js`.
