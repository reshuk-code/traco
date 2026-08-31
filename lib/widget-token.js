import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Bearer tokens for the Android widget.
 *
 * The widget is native code outside the WebView, so it cannot use the session
 * cookie. Only the hash is ever stored — the raw token is shown once and is not
 * recoverable, so the table is worthless to anyone who reads it.
 */
export function newWidgetToken() {
  return randomBytes(32).toString('base64url');
}

export function hashWidgetToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

/** Constant-time compare, so a secret cannot be recovered by timing. */
export function safeEqual(a, b) {
  const bufA = Buffer.from(String(a), 'utf8');
  const bufB = Buffer.from(String(b), 'utf8');
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}
