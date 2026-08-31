import Link from 'next/link';

/**
 * The header on a settings detail page: back, then the title.
 *
 * The arrow's target is 44px even though the glyph is 22px — the smallest
 * comfortable tap on a phone, and this is the only way off the page.
 */
export default function DetailHeader({ title, backHref = '/settings' }) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-2xl items-center gap-1.5 px-4 py-3">
        <Link
          href={backHref}
          aria-label="Back to Settings"
          className="-ml-2.5 flex size-11 items-center justify-center rounded-full text-text hover:bg-surface-2"
        >
          <svg
            width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="text-[17px] font-semibold tracking-tight">{title}</h1>
      </div>
    </header>
  );
}
