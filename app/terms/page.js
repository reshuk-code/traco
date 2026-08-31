import LegalShell from '@/app/components/legal-shell';
import { APP } from '@/lib/app-info';

export const metadata = {
  title: 'Terms & Conditions · traco',
  description: 'The terms you agree to when you use traco.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms &amp; Conditions" updated={APP.effectiveDate}>
      <p>
        These terms govern your use of <strong>{APP.name}</strong>, a daily spending
        tracker operated by <strong>{APP.company}</strong>. By creating an account you
        agree to them. If you do not, please do not use the app.
      </p>

      <h2>What traco is</h2>
      <p>
        {APP.name} lets you set a daily spending goal, record what you spend, and carry
        unspent money into the next day. Every figure in the app comes from what{' '}
        <em>you</em> enter. The app is not connected to any bank or payment provider, and
        it does not move money.
      </p>

      <h2>Not financial advice</h2>
      <p>
        {APP.name} is a record-keeping tool, not a financial adviser. Nothing in the app
        &mdash; budgets, challenges, reminders, or any figure it displays &mdash; is
        financial, tax, or legal advice, and it is not a recommendation to spend or not
        spend. Decisions about your money remain yours. We are not responsible for the
        outcome of those decisions.
      </p>

      <h2>Your account</h2>
      <p>
        You need an account to use the app. Keep your password to yourself; you are
        responsible for what happens under your account. One account is for one person.
        Tell us promptly at {APP.contactEmail} if you think someone else has access to it.
      </p>

      <h2>Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>break into, overload, probe, or disrupt the service or its infrastructure;</li>
        <li>use another person&rsquo;s account, or share yours;</li>
        <li>
          automate access in a way that degrades the service for others, or attempt to
          extract data belonging to anyone else;
        </li>
        <li>use the app for anything unlawful.</li>
      </ul>

      <h2>Your data</h2>
      <p>
        What you record stays yours. We store it to run the service and nothing else &mdash;
        what we hold, and why, is set out in full in our{' '}
        <a href="/privacy">Privacy Policy</a>. You can ask for a copy or for deletion at
        any time.
      </p>

      <h2>Availability</h2>
      <p>
        We aim to keep {APP.name} running, but we do not guarantee it will be available
        without interruption or free of faults. The app is provided{' '}
        <strong>as is</strong>. Features may change, and we may add, alter, or withdraw
        parts of the service. Where a change is significant, we will give notice in the
        app.
      </p>
      <p>
        Some features depend on your device and browser: offline logging, reminders, and
        the home-screen widget may behave differently, or not be available at all, on
        certain platforms.
      </p>

      <h2>Keep your own records</h2>
      <p>
        The app is not a system of record for anything you are legally required to keep.
        We take reasonable care, but you should not rely on {APP.name} as your only copy
        of information that matters to you.
      </p>

      <h2>Liability</h2>
      <p>
        To the fullest extent permitted by law, {APP.company} is not liable for indirect
        or consequential loss, lost savings, lost profits, or loss of data arising from
        your use of the app. Nothing in these terms limits liability that cannot be
        limited by law, including for death or personal injury caused by negligence, or
        for fraud.
      </p>

      <h2>Ending it</h2>
      <p>
        You can stop using {APP.name} and delete your account at any time. We may suspend
        or close an account that breaches these terms, or where we are required to by law.
        Deleting your account deletes the data tied to it.
      </p>

      <h2>Changes to these terms</h2>
      <p>
        We may update these terms. The date at the top shows the current version, and
        material changes will be announced in the app before they take effect. Continuing
        to use {APP.name} after a change means you accept it.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of {APP.jurisdiction}, and the courts of{' '}
        {APP.jurisdiction} have exclusive jurisdiction over any dispute arising from them.
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
        See also our <a href="/privacy">Privacy Policy</a>.
      </p>
    </LegalShell>
  );
}
