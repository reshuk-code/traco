'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/dashboard', label: 'Today' },
  { href: '/history', label: 'History' },
  { href: '/settings', label: 'Settings' },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {LINKS.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? 'bg-surface-2 text-text'
                : 'text-muted hover:text-text'
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
