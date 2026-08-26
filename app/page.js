import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await getUser();
  if (user) redirect('/dashboard');

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand">traco</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Know what you spend, every single day.
        </h1>
        <p className="mt-4 text-muted">
          Set a daily goal — 400 a day, 200 a day, whatever fits. Log what you spend
          as you go, and keep a full history of every day and every expense.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/auth/sign-up" className="btn btn-primary">
            Create an account
          </Link>
          <Link href="/auth/sign-in" className="btn btn-ghost">
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
