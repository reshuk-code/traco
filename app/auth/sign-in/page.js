import SignInForm from './sign-in-form';

export const metadata = { title: 'Sign in · traco' };

/**
 * A server component purely so the form itself still renders on the server.
 * `searchParams` is a Promise in Next 16.
 */
export default async function SignInPage({ searchParams }) {
  const { reset } = await searchParams;
  return <SignInForm justReset={reset === '1'} />;
}
