'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

function subscribeStandalone(callback) {
  const query = window.matchMedia('(display-mode: standalone)');
  query.addEventListener('change', callback);
  window.addEventListener('appinstalled', callback);
  return () => {
    query.removeEventListener('change', callback);
    window.removeEventListener('appinstalled', callback);
  };
}

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone ||
    false
  );
}

const notStandalone = () => false;

export default function InstallCta() {
  const [prompt, setPrompt] = useState(null);
  const [justInstalled, setJustInstalled] = useState(false);
  const [note, setNote] = useState('');

  const standalone = useSyncExternalStore(subscribeStandalone, isStandalone, notStandalone);
  const installed = standalone || justInstalled;

  useEffect(() => {
    // Chromium fires this when the app qualifies for installation. Keeping the
    // event lets us offer a real one-tap install instead of instructions.
    const onPrompt = (event) => {
      event.preventDefault();
      setPrompt(event);
    };
    const onInstalled = () => {
      setJustInstalled(true);
      setPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function install() {
    if (!prompt) {
      document.getElementById('install-steps')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setJustInstalled(true);
    setPrompt(null);
  }

  async function share() {
    const url = window.location.origin;
    const payload = {
      title: 'traco',
      text: 'A daily spending tracker that rolls what you save into tomorrow.',
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }
      await navigator.clipboard.writeText(url);
      setNote('Link copied.');
    } catch {
      setNote(url);
    }
  }

  if (installed) {
    return (
      <div
        className="flex items-center gap-3 rounded-card px-5 py-4"
        style={{ background: 'color-mix(in srgb, var(--good) 12%, transparent)' }}
      >
        <span className="text-xl" aria-hidden="true">
          &#10003;
        </span>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--good)' }}>
            Installed on this device
          </p>
          <p className="mt-0.5 text-sm text-muted">
            Open traco from your home screen — it works without a connection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={install}
          className="btn btn-primary !px-6 !py-3.5 sm:!py-3"
        >
          {prompt ? 'Install traco' : 'Show me how'}
        </button>
        <button
          type="button"
          onClick={share}
          className="btn btn-ghost !px-6 !py-3.5 sm:!py-3"
        >
          Share
        </button>
      </div>
      {note && (
        <p className="mt-3 text-xs text-muted" role="status">
          {note}
        </p>
      )}

      {/* Only when the button above actually installs — otherwise it already
          is the way to the steps, and two links would say the same thing. */}
      {prompt && (
        <a
          href="#install-steps"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline lg:hidden"
        >
          How to install
          <span aria-hidden="true">↓</span>
        </a>
      )}
    </div>
  );
}
