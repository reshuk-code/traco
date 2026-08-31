'use client';

import { useActionState, useState } from 'react';
import { updateName } from '@/app/actions/settings';
import { deleteAccount } from '@/app/actions/account';
import SaveBar, { useSaveState } from '@/app/components/save-bar';
import SignOutButton from '@/app/components/sign-out-button';
import Spinner from '@/app/components/spinner';

function initials(name) {
  return name.trim().charAt(0).toUpperCase() || '?';
}

export default function AccountForm({ user, memberSince }) {
  const [state, formAction, isPending] = useActionState(updateName, null);
  const { state: saveState, markDirty } = useSaveState(isPending, state?.ok);

  const [confirming, setConfirming] = useState(false);
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteAccount, null);

  return (
    <div className="flex flex-col gap-3.5">
      <section className="card flex items-center gap-3.5 p-[18px]">
        <span className="flex size-[52px] shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 text-xl font-semibold text-muted">
          {initials(user.name)}
        </span>
        <span className="min-w-0">
          <span className="block text-[17px] font-semibold">{user.name}</span>
          {memberSince && (
            <span className="mt-0.5 block text-[13px] text-muted">
              Member since {memberSince}
            </span>
          )}
        </span>
      </section>

      <form action={formAction} onChange={markDirty} className="flex flex-col gap-3.5">
        <section className="card p-[18px]">
          <label className="label" htmlFor="name">Your name</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={80}
            defaultValue={user.name}
            className="field"
          />

          <div className="mt-4 flex items-baseline justify-between gap-3">
            <span className="label !mb-0">Email</span>
            <span className="text-[11px] text-muted">Used to sign in</span>
          </div>
          {/* Read-only on purpose: the address is the sign-in identity, and
              changing it is a re-verification flow, not a text field. */}
          <p className="mt-1.5 rounded-field border border-border bg-bg px-3 py-2.5 text-[15px] text-muted">
            {user.email}
          </p>

          {state?.error && (
            <p className="mt-3 text-sm text-over" role="alert">{state.error}</p>
          )}
        </section>

        <SaveBar state={saveState} />
      </form>

      <section className="card divide-y divide-border overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-4 py-3.5">
          <span className="text-[15px]">Signed in on this device</span>
          <SignOutButton />
        </div>
      </section>

      <section className="card p-[18px]">
        <h2 className="text-[15px] font-semibold text-over">Delete account</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
          Removes your expenses, goals, challenges, reminders and widget tokens. This
          cannot be undone.
        </p>

        {confirming ? (
          <form action={deleteAction} className="mt-3.5">
            <label className="label" htmlFor="confirm_email">
              Type <span className="text-text">{user.email}</span> to confirm
            </label>
            <input
              id="confirm_email"
              name="confirm_email"
              type="email"
              autoComplete="off"
              required
              className="field"
            />

            {deleteState?.error && (
              <p className="mt-3 text-sm text-over" role="alert">{deleteState.error}</p>
            )}

            <div className="mt-3 flex gap-2.5">
              <button
                type="submit"
                disabled={isDeleting}
                className="btn flex-1 !py-3"
                style={{ background: 'var(--over)', color: '#ffffff' }}
              >
                {isDeleting ? <Spinner size={18} label="Deleting" /> : 'Delete permanently'}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="btn btn-ghost !py-3"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="btn mt-3 !py-2.5 !text-[14px]"
            style={{
              border: '1px solid color-mix(in srgb, var(--over) 40%, transparent)',
              color: 'var(--over)',
            }}
          >
            Delete my account
          </button>
        )}
      </section>
    </div>
  );
}
