/**
 * The site's public URL.
 *
 * An explicit NEXT_PUBLIC_SITE_URL wins; otherwise Vercel's own production
 * domain is used, so a deployment resolves correctly with nothing configured.
 *
 * Password reset needs this as an absolute URL: the reset link is built on the
 * auth server and emailed, so a relative path has nothing to resolve against.
 */
export function resolveSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return 'http://localhost:3000';
}
