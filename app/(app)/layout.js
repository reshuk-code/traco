import AppChrome from '@/app/components/app-chrome';
import ThemeSync from '@/app/components/theme-sync';
import TermsGate from '@/app/components/terms-gate';
import { APP } from '@/lib/app-info';
import { requireUser, getSettings } from '@/lib/data';

// Every screen in here reads the session, so none of it can be prerendered.
export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }) {
  const user = await requireUser();
  const settings = await getSettings(user.id);
  const accepted = settings.terms_version === APP.termsVersion;

  return (
    <>
      {/* A device that has never seen this account would otherwise open on the
          default theme; this is what closes that gap. */}
      <ThemeSync theme={settings.theme} mode={settings.theme_mode} />
      {/* Rendered instead of the app, not over it: a dialog can be dismissed,
          and unrecorded consent is worse than none. */}
      {accepted ? (
        <AppChrome>{children}</AppChrome>
      ) : (
        <TermsGate returning={settings.terms_version !== null} />
      )}
    </>
  );
}
