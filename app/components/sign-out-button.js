'use client';

import { useTransition } from 'react';
import { signOut } from '@/app/auth/actions';
import Spinner from './spinner';

/**
 * Signing out also clears the offline copies of this account's pages, so the
 * next person to open the app on this device cannot page through cached data.
 */
export default function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      try {
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((key) => caches.delete(key)));
        }
        navigator.serviceWorker?.controller?.postMessage({ type: 'clear-cache' });
        window.localStorage.removeItem('traco.outbox.v1');
      } catch {
        // Clearing is best-effort; never block the sign-out itself.
      }
      await signOut();
    });
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isPending}
      className="shrink-0 cursor-pointer text-[13px] font-semibold text-over hover:underline disabled:opacity-60"
    >
      {isPending ? <Spinner size={15} label="Signing out" /> : 'Sign out'}
    </button>
  );
}
