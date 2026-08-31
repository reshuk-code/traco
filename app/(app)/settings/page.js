import Link from 'next/link';
import PageHeader from '@/app/components/page-header';
import { requireUser, getSettings } from '@/lib/data';
import { sql } from '@/lib/db';
import { formatMoney } from '@/lib/money';
import { THEMES, THEME_MODES } from '@/lib/themes';
import { APP } from '@/lib/app-info';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Settings · traco' };

function hourLabel(h) {
  if (h === null || h === undefined) return 'Off';
  const suffix = h < 12 ? 'am' : 'pm';
  return `${h % 12 === 0 ? 12 : h % 12}:00 ${suffix}`;
}

function Chevron() {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      className="shrink-0 text-muted/70" aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

/** A group of rows renders as one card, so the rules read as dividers. */
function Group({ title, children }) {
  return (
    <section className="flex flex-col gap-[7px]">
      <h2 className="px-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
        {title}
      </h2>
      <div className="card divide-y divide-border overflow-hidden">{children}</div>
    </section>
  );
}

function Row({ href, label, value }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2"
    >
      <span className="min-w-0 flex-1 text-[15px]">{label}</span>
      {value && (
        <span className="shrink-0 text-[13px] tabular-nums text-muted">{value}</span>
      )}
      <Chevron />
    </Link>
  );
}

export default async function SettingsPage() {
  const user = await requireUser();
  const settings = await getSettings(user.id);

  const [extras, goalCount, tokenCount] = await Promise.all([
    sql`select reminder_hour from public.user_settings where user_id = ${user.id}`,
    sql`select count(distinct effective_from)::int as n from public.goal_history where user_id = ${user.id}`,
    sql`select count(*)::int as n from public.widget_tokens where user_id = ${user.id}`,
  ]);

  const reminderHour = extras[0]?.reminder_hour ?? null;
  const themeLabel = THEMES.find((t) => t.id === settings.theme)?.label ?? 'Default';
  const modeLabel = THEME_MODES.find((m) => m.id === settings.theme_mode)?.label ?? 'System';

  return (
    <>
      <PageHeader title="Settings" />

      <div className="mx-auto flex max-w-2xl flex-col gap-[18px] px-5 py-4">
        <Group title="Look and feel">
          <Row
            href="/settings/appearance"
            label="Appearance"
            value={`${themeLabel} · ${modeLabel}`}
          />
        </Group>

        <Group title="Budget">
          <Row
            href="/settings/budget"
            label="Daily budget"
            value={formatMoney(settings.daily_goal_cents, settings.currency)}
          />
          <Row href="/settings/day" label="Your day" value={settings.timezone} />
          {goalCount[0].n > 0 && (
            <Row href="/settings/goals" label="Goal changes" value={String(goalCount[0].n)} />
          )}
        </Group>

        <Group title="Account and devices">
          <Row href="/settings/account" label="Account" value={user.name} />
          <Row
            href="/settings/reminder"
            label="Daily reminder"
            value={hourLabel(reminderHour)}
          />
          <Row
            href="/settings/widget"
            label="Home-screen widget"
            value={tokenCount[0].n === 0 ? 'Not set up' : String(tokenCount[0].n)}
          />
        </Group>

        <Group title={`About ${APP.name}`}>
          <Row href="/privacy" label="Privacy Policy" />
          <Row href="/terms" label="Terms & Conditions" />
          <div className="flex items-center gap-3 px-4 py-3.5">
            <span className="min-w-0 flex-1 text-[15px] text-muted">Version</span>
            <span className="shrink-0 text-[13px] tabular-nums text-muted">
              {APP.version}
            </span>
          </div>
        </Group>

        <p className="px-0.5 text-center text-[11px] leading-relaxed text-muted">
          &copy; {APP.company}
        </p>
      </div>
    </>
  );
}
