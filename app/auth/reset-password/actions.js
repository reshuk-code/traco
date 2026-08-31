'use server';

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/server';

export async function resetPassword(_prevState, formData) {
  const token = String(formData.get('token') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');

  if (!token) {
    return { error: 'This reset link is missing its token. Request a new one.' };
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' };
  }
  if (password !== confirm) {
    return { error: 'Those two passwords do not match.' };
  }

  const { error } = await auth.resetPassword({ newPassword: password, token });

  if (error) {
    // Expired and already-used links land here, and that is the common case —
    // say what to do rather than repeating a server message nobody can act on.
    return {
      error:
        error.message ||
        'That link has expired or was already used. Request a new one.',
    };
  }

  redirect('/auth/sign-in?reset=1');
}
