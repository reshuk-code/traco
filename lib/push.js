'use client';

/**
 * Talking to the browser's push manager.
 *
 * The subscription is per device, not per account: the same person on a phone
 * and a laptop is two rows. The endpoint the push service hands back identifies
 * the device, so re-subscribing replaces rather than duplicates.
 */

/** The VAPID key travels as base64url but `subscribe` wants raw bytes. */
function toUint8Array(base64) {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function pushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * `navigator.serviceWorker.ready` never rejects — if nothing is registered it
 * simply hangs forever, which is exactly how this used to spin with no error.
 * Everything here goes through this timeout instead.
 */
export async function readyRegistration(timeoutMs = 8000) {
  if (!pushSupported()) return null;
  let timer;
  try {
    return await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((resolve) => {
        timer = setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Returns `{ ok: true, subscription }`, or `{ ok: false, reason }` so the caller
 * can say something specific rather than a shrug.
 */
export async function subscribeToPush(publicKey) {
  if (!pushSupported()) return { ok: false, reason: 'unsupported' };
  if (!publicKey) return { ok: false, reason: 'no-key' };

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, reason: 'denied' };

  const registration = await readyRegistration();
  if (!registration) return { ok: false, reason: 'no-service-worker' };

  try {
    const existing = await registration.pushManager.getSubscription();
    if (existing) return { ok: true, subscription: existing.toJSON() };

    const subscription = await registration.pushManager.subscribe({
      // Chrome refuses a silent subscription; every push must show something.
      userVisibleOnly: true,
      applicationServerKey: toUint8Array(publicKey),
    });
    return { ok: true, subscription: subscription.toJSON() };
  } catch {
    // Usually a malformed VAPID key, or the push service being unreachable.
    return { ok: false, reason: 'failed' };
  }
}

/** Tears the device subscription down. Returns the endpoint it removed, if any. */
export async function unsubscribeFromPush() {
  const registration = await readyRegistration();
  if (!registration) return null;
  try {
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return null;
    const { endpoint } = subscription;
    await subscription.unsubscribe();
    return endpoint;
  } catch {
    return null;
  }
}

/** Whether this device already holds a subscription. Never hangs. */
export async function currentSubscription() {
  const registration = await readyRegistration(4000);
  if (!registration) return null;
  try {
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

export function notificationPermission() {
  return pushSupported() ? Notification.permission : 'unsupported';
}
