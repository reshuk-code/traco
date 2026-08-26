'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function TodayIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"
      stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round">
      <path d="M6 19v-5M12 19V8M18 19v-8" />
    </svg>
  );
}

function HistoryIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"
      stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round">
      <path d="M5 7h14M5 12h14M5 17h9" />
    </svg>
  );
}

function SettingsIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"
      stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round">
      <path d="M4 8h10M18 8h2M4 16h4M12 16h8" />
      <circle cx="16" cy="8" r="2.2" />
      <circle cx="10" cy="16" r="2.2" />
    </svg>
  );
}

const TABS = [
  { href: '/dashboard', label: 'Today', Icon: TodayIcon },
  { href: '/history', label: 'History', Icon: HistoryIcon },
  { href: '/settings', label: 'Settings', Icon: SettingsIcon },
];

/**
 * Primary navigation lives at the bottom: this is a phone app used one-handed,
 * and the top of the screen is the hardest place to reach.
 */
export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface pt-2"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto flex max-w-md">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center gap-1 py-1.5 transition-colors ${
                active ? 'text-brand' : 'text-muted hover:text-text'
              }`}
            >
              <Icon active={active} />
              <span className={`text-[11px] ${active ? 'font-semibold' : 'font-medium'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
