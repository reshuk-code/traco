/** The slim title bar each screen carries, now that navigation sits at the bottom. */
export default function PageHeader({ title, subtitle, action }) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-5 py-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-[1.1875rem] font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}
