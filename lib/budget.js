/**
 * Rollover budgeting.
 *
 * Each day is allocated its goal ("base"). Anything left over at the end of the
 * day is added to the next day's budget, so a quiet day makes tomorrow roomier.
 *
 * Overspending does NOT carry. A day where you spend more than you had shows
 * its own shortfall, then the slate is wiped: the next day starts from its goal
 * again. The running balance can therefore never go negative.
 */
export function buildLedger(series, rolloverEnabled) {
  let carry = 0;

  return series.map((day) => {
    const carryInCents = rolloverEnabled ? carry : 0;
    const allowanceCents = day.base_cents + carryInCents;

    // The day's own result, which is allowed to be negative...
    const leftoverCents = allowanceCents - day.spent_cents;
    // ...but only a surplus is handed to tomorrow.
    carry = rolloverEnabled ? Math.max(0, leftoverCents) : 0;

    return {
      ...day,
      carryInCents,
      allowanceCents,
      leftoverCents,
      overByCents: leftoverCents < 0 ? -leftoverCents : 0,
      balanceAfterCents: carry,
      over: leftoverCents < 0,
    };
  });
}

export function summarize(ledger) {
  return {
    today: ledger.at(-1) ?? null,
    budgetCents: ledger.reduce((sum, d) => sum + d.base_cents, 0),
    spentCents: ledger.reduce((sum, d) => sum + d.spent_cents, 0),
    entries: ledger.reduce((sum, d) => sum + d.entries, 0),
    daysWithSpending: ledger.filter((d) => d.spent_cents > 0).length,
    daysWithinAllowance: ledger.filter((d) => !d.over).length,
    daysOver: ledger.filter((d) => d.over).length,
    // Everything ever gone over, summed day by day. The ledger itself still
    // never carries this as debt — it exists only to size a recovery challenge.
    overspentCents: ledger.reduce((sum, d) => sum + d.overByCents, 0),
  };
}
