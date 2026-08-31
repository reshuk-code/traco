export const dynamic = 'force-dynamic';

/**
 * Digital Asset Links, served at /.well-known/assetlinks.json via a rewrite.
 *
 * This is what proves the APK and this domain are the same product. Without it
 * a Trusted Web Activity falls back to showing a browser URL bar, which is the
 * usual reason a TWA "looks wrong" after install.
 *
 * The fingerprint comes from the signing keystore:
 *   keytool -list -v -keystore android.keystore -alias android
 */
export function GET() {
  // A signing fingerprint is public by design — this exact value is served to
  // anyone who asks for it. Hardcoding the default keeps a deploy self-contained.
  // A fork signing with its own keystore MUST override it, or Android will refuse
  // to verify the link and the app opens with a browser URL bar.
  const FINGERPRINT = '2C:D8:69:E7:B0:0C:F3:67:A2:2D:5E:26:CC:63:2D:68:B9:CC:75:7D:F8:EF:93:2C:62:FF:3B:65:7A:17:AB:3D';

  const fingerprint = process.env.ANDROID_CERT_FINGERPRINT || FINGERPRINT;
  const packageName = process.env.ANDROID_PACKAGE_NAME || 'app.vercel.traco_pi.twa';

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
