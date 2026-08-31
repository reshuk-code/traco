import { auth } from '@/lib/auth/server';

export default auth.middleware({
  loginUrl: '/auth/sign-in',
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/challenges/:path*',
    '/history/:path*',
    '/settings/:path*',
  ],
};
