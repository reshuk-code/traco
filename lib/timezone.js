/**
 * IANA timezone names are written straight into `now() at time zone $1`, and
 * Postgres raises 22023 on a name it does not know. That error is not contained:
 * it takes down every authenticated page for the user who set it, and — because
 * the reminder sender evaluates all users in one query — it used to stop
 * notifications for everybody else too.
 *
 * So the name is checked at the boundary, before it can ever reach the database.
 */
export function isValidTimezone(name) {
  if (typeof name !== 'string' || name.length === 0 || name.length > 64) return false;
  try {
    // Throws RangeError on anything the runtime does not recognise.
    new Intl.DateTimeFormat('en-US', { timeZone: name });
    return true;
  } catch {
    return false;
  }
}
