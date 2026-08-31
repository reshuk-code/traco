import DetailHeader from '@/app/components/detail-header';
import ThemePicker from '@/app/components/theme-picker';
import { requireUser, getSettings } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Appearance · traco' };

export default async function AppearancePage() {
  const user = await requireUser();
  const settings = await getSettings(user.id);

  return (
    <>
      <DetailHeader title="Appearance" />
      <div className="mx-auto flex max-w-2xl flex-col gap-3.5 px-5 py-4">
        <section className="card p-[18px]">
          <ThemePicker theme={settings.theme} mode={settings.theme_mode} />
        </section>
      </div>
    </>
  );
}
