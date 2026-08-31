import DetailHeader from '@/app/components/detail-header';
import ReminderToggle from '@/app/components/reminder-toggle';
import { requireUser, getSettings } from '@/lib/data';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Daily reminder · traco' };

export default async function ReminderPage() {
  const user = await requireUser();
  const settings = await getSettings(user.id);
  const rows = await sql`
    select reminder_hour from public.user_settings where user_id = ${user.id}
  `;

  return (
    <>
      <DetailHeader title="Daily reminder" />
      <div className="mx-auto flex max-w-2xl flex-col gap-3.5 px-5 py-4">
        <section className="card p-[18px]">
          <ReminderToggle
            reminderHour={rows[0]?.reminder_hour ?? null}
            publicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY}
            timezone={settings.timezone}
          />
        </section>
      </div>
    </>
  );
}
