export const dynamic = 'force-dynamic';

/**
 * Digital Asset Links, served at /.well-known/assetlinks.json via a rewrite.
 *
 * This is what proves the APK and this domain are the same product. Without it
 * a Trusted Web Activity falls back to showing a browser URL bar, which is the
 * usual reason a TWA "looks wrong" after install.
 *
 * The fingerprint comes from the signing keystore:
 *   keytool -list -v -keystore android.keystore -alias traco
 */
export function GET() {
  const fingerprint = process.env.ANDROID_CERT_FINGERPRINT;
  const packageName = process.env.ANDROID_PACKAGE_NAME || 'app.vercel.traco_pi';

  const body = fingerprint
    ? [
        {
          relation: ['delegate_permission/common.handle_all_urls'],
          target: {
            namespace: 'android_app',
            package_name: packageName,
            sha256_cert_fingerprints: [fingerprint],
          },
        },
      ]
    : [];

  return Response.json(body, {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, max-age=300',
    },
  });
}
