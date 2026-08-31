/**
 * Challenges: a cap the user imposes on themselves, judged against the ledger.
 *
 * A challenge never changes the budget maths in `buildLedger`. It reads the
 * ledger that already exists and reports a second, separate verdict — which is
 * what stops a challenge from retroactively re-scoring days once it is over,
 * and what lets every user run a different challenge with no user-specific
 * code: the rule is this one function, the parameters are a row.
 *
 * Every date here is an ISO `YYYY-MM-DD` string. They compare correctly with
 * `<` and `>` as-is, which is how the rest of the app treats days too.
 */

/** Inclusive count of days from `from` to `to`. */
function dayCount(from, to) {
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
  return Math.floor(ms / 86_400_000) + 1;
}

const min = (a, b) => (a < b ? a : b);

/**
 * @param challenge         a row from public.challenges
 * @param ledger            rows from buildLedger()
 * @param today             the user's local day
 * @param pendingTodayCents spending still sitting in the offline outbox
 *
 * The outbox has to be passed in: an entry logged with no signal is real money
 * spent, and a challenge that ignored it would quietly under-count the day.
 */
export function evaluateChallenge(challenge, ledger, today, pendingTodayCents = 0) {
  if (!challenge) return null;

  const cap = challenge.cap_cents;
  const daysTotal = dayCount(challenge.starts_on, challenge.ends_on);

  // A challenge stops accruing at whichever came first: its end, the day it was
  // abandoned, or today.
  const lastDay = challenge.ended_on
    ? min(challenge.ended_on, min(challenge.ends_on, today))
    : min(challenge.ends_on, today);

  const days = [];
  let recoveredCents = 0;

  for (const row of ledger) {
    if (row.day < challenge.starts_on || row.day > lastDay) continue;

    const spentCents =
      row.day === today ? row.spent_cents + pendingTodayCents : row.spent_cents;

    // Progress is measured against the real goal, not the cap: coming in at 145
    // on a goal of 200 puts 55 back, whatever the challenge asked for.
    recoveredCents += row.base_cents - spentCents;

    days.push({
      day: row.day,
      spentCents,
      capCents: cap,
      slipped: spentCents > cap,
      overByCents: Math.max(0, spentCents - cap),
    });
  }

  // A run of bad days should not leave the user staring at a negative recovery.
  recoveredCents = Math.max(0, recoveredCents);

  const slipDays = days.filter((d) => d.slipped);
  const slipsUsed = slipDays.length;
  const slipsLeft = Math.max(0, challenge.allowed_slips - slipsUsed);

  const todayRow = days.find((d) => d.day === today) ?? null;
  const todaySpentCents = todayRow?.spentCents ?? 0;

  const isOver = challenge.status !== 'active' || today > challenge.ends_on;
  const failed = slipsUsed > challenge.allowed_slips;

  let state;
  if (failed) state = 'failed';
  else if (isOver) state = 'complete';
  else if (todayRow?.slipped) state = 'at_risk';
  else state = 'on_track';

  const daysElapsed = days.length;
  const targetCents = challenge.target_cents ?? null;

  return {
    id: challenge.id,
    capCents: cap,
    startsOn: challenge.starts_on,
    endsOn: challenge.ends_on,
    allowedSlips: challenge.allowed_slips,

    days,
    daysTotal,
    daysElapsed,
    daysLeft: Math.max(0, daysTotal - daysElapsed),
    progressPct: daysTotal > 0 ? Math.min(100, (daysElapsed / daysTotal) * 100) : 0,

    slipDays,
    slipsUsed,
    slipsLeft,

    recoveredCents,
    targetCents,
    recoveryPct:
      targetCents > 0 ? Math.min(100, (recoveredCents / targetCents) * 100) : null,

    todaySpentCents,
    todayOverByCents: todayRow?.overByCents ?? 0,
    todayLeftCents: cap - todaySpentCents,
    todayCounted: todayRow !== null,

    state,
    // `failed` is derived every read rather than stored, so there is no cron job
    // and no write-on-read. Only abandoning is persisted.
    finished: failed || isOver,
  };
}

/**
 * Sizes a recovery challenge: at `capCents` a day against `goalCents`, how long
 * until `overspentCents` is clawed back? Returns null when the cap saves
 * nothing, which would take forever.
 */
export function daysToRecover(overspentCents, goalCents, capCents) {
  const perDay = goalCents - capCents;
  if (perDay <= 0 || overspentCents <= 0) return null;
  return Math.ceil(overspentCents / perDay);
}

/**
 * The category taking the biggest bite. Stays quiet until there is enough
 * logged to mean anything — telling someone with three entries where their
 * money goes is noise, not insight.
 */
export function topCategory(rows, minEntries = 5) {
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const totalCents = rows.reduce((sum, r) => sum + r.cents, 0);
  const totalEntries = rows.reduce((sum, r) => sum + r.entries, 0);
  if (totalEntries < minEntries || totalCents <= 0) return null;

  // getCategoryTotals already orders by spend, but don't depend on that here.
  const top = rows.reduce((best, r) => (r.cents > best.cents ? r : best), rows[0]);

  return {
    category: top.category,
    cents: top.cents,
    entries: top.entries,
    pct: (top.cents / totalCents) * 100,
    totalCents,
  };
}

/** What was gone over from `since` up to the end of `days`, inclusive. */
export function summarizeWindow(days, since) {
  const inWindow = days.filter((d) => d.day >= since);
  return {
    overspentCents: inWindow.reduce((sum, d) => sum + d.overByCents, 0),
    daysOver: inWindow.filter((d) => d.overByCents > 0).length,
    daysCounted: inWindow.length,
  };
}

/** Round a cap to a whole currency unit — nobody sets a budget of Rs 66.67. */
const wholeUnits = (cents) => Math.round(cents / 100) * 100;

/**
 * The three paces on offer. They differ only in how hard they are; where even
 * 90 days at a cap would not clear the window, `partial` says so rather than
 * letting the number imply the hole is gone.
 */
export function buildPresets(overspentCents, goalCents) {
  // A cap at or above the goal saves nothing, so keep every preset below it.
  const cap = (cents) => Math.max(0, Math.min(wholeUnits(cents), goalCents - 100));

  const seen = new Set();

  return [
    { id: 'half', label: 'Steady', capCents: cap(goalCents / 2) },
    { id: 'firm', label: 'Firm', capCents: cap(goalCents / 4) },
    { id: 'zero', label: 'Spend nothing', capCents: 0 },
  ]
    // A very small goal can collapse two paces onto the same number.
    .filter((p) => !seen.has(p.capCents) && seen.add(p.capCents))
    .map((p) => {
      const perDayCents = goalCents - p.capCents;
      const needed = daysToRecover(overspentCents, goalCents, p.capCents);
      const days = Math.min(90, Math.max(1, needed ?? 14));
      const clearsCents = days * perDayCents;
      return {
        ...p,
        perDayCents,
        days,
        clearsCents,
        partial: overspentCents > 0 && clearsCents < overspentCents,
      };
    });
}
