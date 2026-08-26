'use client';

import { useEffect, useRef } from 'react';

/**
 * Reports the browser's timezone so day boundaries match the user's clock.
 * Filled after mount to keep the server-rendered markup stable.
 */
export default function TimezoneField({ name = 'timezone' }) {
  const ref = useRef(null);

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && ref.current) ref.current.value = tz;
    } catch {
      // Keep the UTC default if the browser will not tell us.
    }
  }, []);

  return <input ref={ref} type="hidden" name={name} defaultValue="UTC" />;
}
