import SiteHeader from '@/app/components/site-header';
import { requireUser } from '@/lib/data';

// Every screen in here reads the session, so none of it can be prerendered.
export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }) {
  const user = await requireUser();

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:py-8">{children}</main>
    </>
  );
}
