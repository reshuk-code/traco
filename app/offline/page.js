export const metadata = { title: 'Offline · traco' };

export default function OfflinePage() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm text-center">
        <p className="text-4xl">📴</p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">You&apos;re offline</h1>
        <p className="mt-2 text-sm text-muted">
          This page hasn&apos;t been saved to your device yet. Anything you logged while
          offline is safe and will sync as soon as you reconnect.
        </p>
      </div>
    </main>
  );
}
