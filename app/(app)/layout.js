import BottomNav from '@/app/components/bottom-nav';
import { requireUser } from '@/lib/data';

// Every screen in here reads the session, so none of it can be prerendered.
export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }) {
  await requireUser();

  return (
    <>
      {/* Bottom padding clears the fixed tab bar plus the home indicator. */}
      <div
        className="flex-1"
        style={{ paddingBottom: 'calc(5.25rem + env(safe-area-inset-bottom))' }}
      >
        {children}
      </div>
      <BottomNav />
    </>
  );
}
