'use server';

import { auth } from '@/lib/auth/server';
import { resolveSiteUrl } from '@/lib/site-url';

export async function requestPasswordReset(_prevState, formData) {
  const email = String(formData.get('email') ?? '').trim();

  if (!email || !email.includes('@')) {
    return { error: 'Enter the email address you signed up with.' };
  }

  // Absolute, because the auth server builds the emailed link from it.
  const redirectTo = `${resolveSiteUrl()}/auth/reset-password`;

  const { error } = await auth.requestPasswordReset({ email, redirectTo });

  if (error) {
    return { error: error.message || 'Could not send the reset email. Try again.' };
  }

  // Deliberately the same answer whether or not the address exists: telling a
  // stranger which emails have accounts is a way to enumerate our users.
  return { sent: true, error: null };
}
