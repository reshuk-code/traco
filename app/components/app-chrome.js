'use client';

import { usePathname } from 'next/navigation';
import BottomNav from './bottom-nav';

/** A settings detail page — /settings/anything, but not /settings itself. */
function isDetailRoute(pathname) {
  return /^\/settings\/.+/.test(pathname);
}

/**
 * Decides whether this screen gets the tab bar.
 *
 * Detail pages do not. With one way out, the back arrow is unmissable and the
 * page gets its full height — and a tab tapped mid-edit cannot silently discard
 * what was typed. The bottom padding has to move with it, which is why the
 * padding lives here rather than in the layout: two places deciding the same
 * thing is how you end up with a gap under the last card.
 */
export default function AppChrome({ children }) {
  const detail = isDetailRoute(usePathname());

  return (
    <>
      <div
        className="flex-1"
        style={{
          paddingBottom: detail
            ? 'env(safe-area-inset-bottom)'
            : 'calc(5.25rem + env(safe-area-inset-bottom))',
        }}
      >
        {children}
      </div>
      {!detail && <BottomNav />}
    </>
  );
}
