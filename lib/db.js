import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL);

/**
 * True when a query failed because the database could not be reached at all,
 * rather than because the query itself was bad.
 *
 * This is the difference between "you are offline" and "there is a bug", and
 * the app treats the two very differently: the first degrades to a local,
 * offline-capable view, the second is a real error and must surface.
 */
export function isConnectivityError(error) {
  if (!error) return false;

  const parts = [];
  for (let e = error, depth = 0; e && depth < 5; e = e.cause, depth++) {
    if (e.name) parts.push(String(e.name));
    if (e.message) parts.push(String(e.message));
    if (e.code) parts.push(String(e.code));
  }
  const text = parts.join(' ');

  return /fetch failed|Error connecting to database|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|ETIMEDOUT|ECONNRESET|network|socket hang up|Failed to fetch/i.test(
    text,
  );
}
