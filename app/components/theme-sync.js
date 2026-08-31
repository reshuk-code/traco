'use client';

import { useEffect } from 'react';
import { THEME_STORAGE_KEY } from '@/lib/themes';

/**
 * Pushes the account's saved appearance onto this device.
 *
 * The pre-paint script can only read what this browser already knows, so a
 * fresh device would open on the default theme. This closes that gap: on the
 * first authenticated render it writes the account's choice to the local copy
 * and applies it, and thereafter the two already agree and nothing changes.
 */
export function applyTheme(theme, mode) {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  if (mode === 'system') {
    root.removeAttribute('data-mode');
  } else {
    root.setAttribute('data-mode', mode);
  }
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ theme, mode }));
  } catch {
    // A blocked store costs a flash on next load, nothing more.
  }
}

export default function ThemeSync({ theme, mode }) {
  useEffect(() => {
    applyTheme(theme, mode);
  }, [theme, mode]);

  return null;
}
