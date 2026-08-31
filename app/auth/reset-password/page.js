import Link from 'next/link';
import ResetForm from './reset-form';

export const metadata = { title: 'Set a new password · traco' };

export default async function ResetPasswordPage({ searchParams }) {
  // Better Auth appends the token to the redirect URL it emailed.
  const { token } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-8">
      <div className="py-4">
        <Link href="/" className="text-[17px] font-bold tracking-tight">
          traco
        </Link>
      </div>
      <ResetForm token={typeof token === 'string' ? token : ''} />
    </main>
  );
}
