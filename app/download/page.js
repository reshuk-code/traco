import Link from 'next/link';
import InstallCta from './install-cta';
import InstallSteps from './install-steps';
import AppPreview from './app-preview';
import AndroidApk from './android-apk';

export const metadata = {
  title: 'Get traco — install the app',
  description:
    'Install traco on your phone or computer. A daily budget that grows every time you come in under it. Works offline, no app store needed.',
  alternates: { canonical: '/download' },
  openGraph: {
    type: 'website',
    siteName: 'traco',
    title: 'Get traco — install the app',
    description:
      'A daily spending tracker that rolls what you save into tomorrow. Installs to your home screen and works offline.',
    url: '/download',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Get traco — install the app',
    description:
      'A daily spending tracker that rolls what you save into tomorrow. Installs to your home screen and works offline.',
  },
};

export default function DownloadPage() {
  return (
    <main className="flex-1">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-4">
        <Link href="/" className="text-[17px] font-bold tracking-tight">
          traco
        </Link>
        <Link href="/auth/sign-in" className="text-sm font-medium text-muted hover:text-text">
          Sign in
        </Link>
      </header>

      <div className="mx-auto w-full max-w-5xl px-5 pb-16">
        {/*
          Document order is the mobile order: pitch, then the product, then the
          action. On lg the preview moves into its own column beside both, which
          is why the placement is done with explicit grid cells rather than by
          reordering the markup.
        */}
        <section className="flex flex-col gap-7 pt-6 sm:pt-10 lg:grid lg:grid-cols-[1fr_380px] lg:grid-rows-[auto_auto] lg:items-center lg:gap-x-16 lg:gap-y-8 lg:pt-14">
          <div className="lg:col-start-1 lg:row-start-1 lg:self-end">
            <h1 className="text-[1.875rem] font-bold leading-[1.15] tracking-tight sm:text-4xl lg:text-[2.75rem]">
              Spend less today,
              <br />
              have more tomorrow.
            </h1>
            <p className="mt-3 max-w-md text-base leading-relaxed text-muted sm:text-lg">
              traco gives you a daily budget that grows every time you come in
              under it.
            </p>
          </div>

          <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
            <AppPreview />
          </div>

          <div className="lg:col-start-1 lg:row-start-2 lg:self-start">
            <InstallCta />
            <p className="mt-4 text-[13px] text-muted">
              Free · Works offline · About 1 MB
            </p>
          </div>
        </section>

        <div className="mt-14">
          <InstallSteps />
        </div>

        <div className="mt-6">
          <AndroidApk />
        </div>

        <section className="mt-12 rounded-2xl bg-surface-2 px-6 py-8 text-center">
          <h2 className="text-xl font-bold tracking-tight">Start with today</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Make an account, pick a daily goal, and log your first expense in
            under a minute.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/auth/sign-up" className="btn btn-primary !py-3">
              Create an account
            </Link>
            <Link href="/auth/sign-in" className="btn btn-ghost !py-3">
              Sign in
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
