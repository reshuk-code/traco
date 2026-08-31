import Link from 'next/link';
import { APP } from '@/lib/app-info';

/**
 * Chrome shared by the policy pages. Public on purpose: a privacy policy behind
 * a sign-in wall is one nobody can read before deciding whether to sign up.
 */
export default function LegalShell({ title, updated, children }) {
  return (
    <main className="flex-1">
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-4">
        <Link href="/" className="text-[17px] font-bold tracking-tight">
          {APP.name}
        </Link>
        <Link href="/settings" className="text-sm font-medium text-muted hover:text-text">
          Settings
        </Link>
      </header>

      <article className="legal mx-auto w-full max-w-2xl px-5 pb-20">
        <h1>{title}</h1>
        <p className="lede">
          {APP.company} &middot; Last updated {updated}
        </p>
        {children}
      </article>
    </main>
  );
}
