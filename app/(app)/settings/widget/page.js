import DetailHeader from '@/app/components/detail-header';
import WidgetTokenCard from '@/app/components/widget-token-card';
import { requireUser } from '@/lib/data';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Home-screen widget · traco' };

export default async function WidgetPage() {
  const user = await requireUser();
  const tokens = await sql`
    select id, label, created_at, last_used_at
    from public.widget_tokens
    where user_id = ${user.id}
    order by created_at desc
  `;

  return (
    <>
      <DetailHeader title="Home-screen widget" />
      <div className="mx-auto flex max-w-2xl flex-col gap-3.5 px-5 py-4">
        <section className="card p-[18px]">
          <WidgetTokenCard tokens={tokens} siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? ''} />
        </section>
      </div>
    </>
  );
}
