import DetailHeader from '@/app/components/detail-header';
import AccountForm from './account-form';
import { requireUser } from '@/lib/data';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Account · traco' };

export default async function AccountPage() {
  const user = await requireUser();

  // The settings row is created on first read, so it is the earliest reliable
  // record of when this account started using traco.
  const rows = await sql`
    select created_at from public.user_settings where user_id = ${user.id}
  `;
  const memberSince = rows[0]?.created_at
    ? new Date(rows[0].created_at).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <>
      <DetailHeader title="Account" />
      <div className="mx-auto max-w-2xl px-5 py-4">
        <AccountForm key={user.name} user={user} memberSince={memberSince} />
      </div>
    </>
  );
}
