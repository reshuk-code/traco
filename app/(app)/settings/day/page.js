import DetailHeader from '@/app/components/detail-header';
import DayForm from './day-form';
import { requireUser, getSettings } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your day · traco' };

export default async function DayPage() {
  const user = await requireUser();
  const settings = await getSettings(user.id);

  return (
    <>
      <DetailHeader title="Your day" />
      <div className="mx-auto max-w-2xl px-5 py-4">
        <DayForm key={settings.timezone} timezone={settings.timezone} />
      </div>
    </>
  );
}
