import Link from 'next/link';
import NavLinks from './nav-links';
import SignOutButton from './sign-out-button';

export default function SiteHeader({ user }) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight">
          traco
        </Link>

        <NavLinks />

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-sm text-muted sm:inline">{user.name}</span>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
