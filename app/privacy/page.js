import LegalShell from '@/app/components/legal-shell';
import { APP } from '@/lib/app-info';

export const metadata = {
  title: 'Privacy Policy · traco',
  description:
    'What traco collects, why, where it is stored, and how to get it back or have it deleted.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated={APP.effectiveDate}>
      <p>
        {APP.name} is a daily spending tracker operated by <strong>{APP.company}</strong>{' '}
        (&ldquo;we&rdquo;, &ldquo;us&rdquo;). This policy explains exactly what the app
        stores about you, why, and what you can do about it. It describes the app as it
        is actually built &mdash; not a template.
      </p>

      <h2>What we collect</h2>
      <p>Only what the app needs in order to work:</p>
      <ul>
        <li>
          <strong>Your account</strong> &mdash; name, email address, and a password that
          is stored only as a cryptographic hash. We never see or store your password
          itself.
        </li>
        <li>
          <strong>Your settings</strong> &mdash; daily spending goal, currency, timezone,
          whether rollover is on, your chosen theme, and the hour you asked for a
          reminder.
        </li>
        <li>
          <strong>Your expenses</strong> &mdash; the amount, category, date, and any note
          you choose to write. Notes are free text; whatever you type there, we store.
        </li>
        <li>
          <strong>Your goals and challenges</strong> &mdash; goal changes over time, and
          any spending challenge you start, including its dates and outcome.
        </li>
        <li>
          <strong>Reminder subscriptions</strong> &mdash; if, and only if, you switch on
          the daily reminder, we store the push address your browser issues for that
          device, plus the keys needed to encrypt a notification to it.
        </li>
        <li>
          <strong>Widget tokens</strong> &mdash; if you set up the home-screen widget, we
          store a <em>hash</em> of the token and a label you choose. The token itself is
          shown once and never stored, so it cannot be recovered from our database.
        </li>
      </ul>

      <h2>What we do not collect</h2>
      <p>
        {APP.name} contains <strong>no analytics, no advertising, and no third-party
        trackers of any kind</strong>. We do not collect your location, contacts, photos,
        device identifiers for advertising, or any bank or card details &mdash; the app has
        no connection to your bank. You type in what you spent; nothing is read
        automatically.
      </p>
      <p>
        We do not sell, rent, or share your data with anyone for marketing, and we do not
        build profiles for advertising.
      </p>

      <h2>Why we hold it</h2>
      <p>
        To provide the service you signed up for: to show your budget, keep your history,
        run your challenges, and send the reminder you asked for. We also keep it to
        secure accounts and to diagnose faults. We have no other purpose for it.
      </p>

      <h2>Who processes it for us</h2>
      <p>We keep the list of third parties as short as we can:</p>
      <ul>
        <li>
          <strong>Neon</strong> &mdash; hosts the database and handles authentication. Your
          account and all app data live there.
        </li>
        <li>
          <strong>Vercel</strong> &mdash; hosts and runs the application. Ordinary server
          logs pass through Vercel and may include your IP address and the pages
          requested.
        </li>
        <li>
          <strong>Your browser&rsquo;s push service</strong> &mdash; if reminders are on,
          the notification is delivered through the push service your browser vendor
          operates (for example Google for Chrome, Apple for Safari). The contents are
          encrypted to your device.
        </li>
      </ul>
      <p>
        These providers act on our instructions. Data may be stored on servers outside{' '}
        {APP.jurisdiction}, in the regions those providers operate.
      </p>

      <h2>What stays on your device</h2>
      <p>
        Some things never leave your phone or computer: expenses you log while offline
        wait in your browser&rsquo;s local storage until they sync, your theme choice is
        kept there so the app opens in the right colours, and the widget token is kept by
        the Android app. Signing out clears the offline queue and the cached pages from
        that device.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Your data stays for as long as your account exists, because a spending history is
        the point of the app. Delete your account and everything tied to it &mdash;
        expenses, goals, challenges, reminder subscriptions, widget tokens &mdash; is
        deleted with it. Reminder subscriptions are also removed automatically when a
        device stops accepting them.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask us to give you a copy of your data, correct it, or delete it entirely.
        Email <strong>{APP.contactEmail}</strong> and we will act on it within 30 days.
        You can change most of it yourself at any time in Settings, and you can revoke a
        widget token or switch off reminders there too.
      </p>

      <h2>Security</h2>
      <p>
        Traffic is encrypted in transit. Passwords are hashed, never stored in readable
        form, and widget tokens are stored only as hashes. No system is perfectly secure,
        and we will not pretend otherwise &mdash; but we hold as little as possible, which
        is the most effective protection there is.
      </p>

      <h2>Children</h2>
      <p>
        {APP.name} is not directed at children under 13, and we do not knowingly collect
        their data. If you believe a child has created an account, contact us and we will
        remove it.
      </p>

      <h2>Changes</h2>
      <p>
        If we change this policy we will update the date at the top. Material changes will
        be announced in the app before they take effect.
      </p>

      <h2>Contact</h2>
      <p>
        {APP.company}
        <br />
        {APP.address}
        <br />
        {APP.contactEmail}
      </p>

      <hr />
      <p>
        See also our <a href="/terms">Terms &amp; Conditions</a>.
      </p>
    </LegalShell>
  );
}
