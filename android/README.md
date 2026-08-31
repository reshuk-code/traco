# traco on Android — TWA wrapper + home-screen widget

A PWA cannot draw a home-screen widget. Android widgets are `AppWidgetProvider`
+ `RemoteViews` inside a real APK, and no web API exposes them. So traco gets
wrapped in a **Trusted Web Activity**: the same web app, running full-screen with
no browser UI, inside an APK that *can* ship a widget.

Nothing about the web app changes. The widget reads one endpoint,
`/api/widget/summary`, which already returns preformatted strings — so currency
and rollover logic stay in one place and the widget follows any change for free.

> **Status:** the web half (endpoint, token auth, asset links) is built and
> tested. The Android half is written in **Java**, is already placed in the
> generated project, and its syntax is verified — but it has not been fully
> compiled against the Android SDK, because installing the SDK platform means
> accepting Google’s licence agreements. `bubblewrap build` does that the first
> time you run it. Expect to fix small things then.

> **Why Java, not Kotlin:** Bubblewrap generates a Java-only Gradle project with
> no Kotlin plugin, and regenerates `build.gradle` on `bubblewrap update` — so
> adding the Kotlin plugin here would be silently reverted, and would drag the
> Kotlin stdlib into the APK for about 150 lines of code.

## What you need

- **JDK 17** and the **Android SDK** (easiest via Android Studio)
- **Bubblewrap**: `npm install -g @bubblewrap/cli`

## 1. Generate the APK project

From the repo root:

```bash
cd android
bubblewrap init --manifest https://traco-pi.vercel.app/manifest.webmanifest
```

Answer the prompts, or point it at the values in `twa-manifest.json`. The
important ones:

| Prompt | Value |
| --- | --- |
| Package ID | `app.vercel.traco_pi.twa` |
| Host | `traco-pi.vercel.app` |
| Start URL | `/dashboard` |
| Signing key | create one; remember the passwords |

This creates a Gradle project in `android/` alongside these files.

## 2. Prove the domain owns the app

Without this the TWA opens with a browser URL bar across the top — the usual
reason a wrapped PWA "looks wrong".

Read the fingerprint out of the keystore Bubblewrap just made:

```bash
keytool -list -v -keystore android.keystore -alias android | grep "SHA256:"
```

Set it on Vercel as an environment variable, then redeploy:

```
ANDROID_CERT_FINGERPRINT=AA:BB:CC:...   # the full colon-separated SHA-256
ANDROID_PACKAGE_NAME=app.vercel.traco_pi.twa
```

`/.well-known/assetlinks.json` is served by `app/api/assetlinks/route.js` through
a rewrite in `next.config.mjs`, and returns an empty array until that variable is
set. Confirm it after deploying:

```bash
curl https://traco-pi.vercel.app/.well-known/assetlinks.json
```

## 3. Drop the widget in — already done

The sources are in place under
`app/src/main/java/app/vercel/traco_pi/twa/widget/`, the layouts and drawables
are in `app/src/main/res/`, and the receiver and configure activity are merged
into the `<application>` element of `app/src/main/AndroidManifest.xml`.

`widget/` keeps an identical reference copy of every file, so a regenerated
project can be repopulated from it. If you edit one copy, copy it across.

## 4. Build and install

```bash
bubblewrap build
adb install ./app-release-signed.apk
```

The first run installs the SDK platform and build-tools, asks you to accept the
Android SDK licences, and prompts for the keystore passwords set during `init`.

If the token-entry screen never appears when you drop the widget on the home
screen, the first thing to try is `android:exported="true"` on
`TracoWidgetConfigureActivity` in the manifest.

## 5. Connect the widget

1. In traco: **Settings → Home-screen widget → Generate**.
2. Copy the token. It is shown **once** — only its SHA-256 hash is stored, so it
   cannot be recovered later. Lose it and you revoke and mint another.
3. Long-press the home screen → Widgets → traco → drag it out.
4. Paste the token.

Tapping the widget refreshes it; tapping **+ Log** opens the log form directly.

## How it refreshes

`updatePeriodMillis` is 30 minutes, which is the floor Android enforces —
anything smaller is silently rounded up. Between those, a tap refreshes. The
`onUpdate` handler uses `goAsync()` because a `BroadcastReceiver` is killed as
soon as `onReceive` returns, which would otherwise cancel the network call.

## Security notes

- The token is a bearer credential with **read-only** access to one account's
  summary. It cannot log expenses, change settings, or read expense notes.
- Only the hash is stored server-side, so a leaked database grants nothing.
- Revoke any token any time from Settings; the widget then shows a refresh error
  rather than stale data.
- **`android.keystore` must never be committed or shared.** It is the app’s
  identity: publishing it lets anyone sign updates as you, and losing it means
  you can never update the app again. It is gitignored — back it up somewhere
  private.
- Tokens live in `SharedPreferences`, which is private to the app but readable on
  a rooted device. Same trust model as a session cookie.

## If you would rather not ship an APK

The daily push notification already delivers the same numbers to your lock
screen with no APK, no Play Store, and no keystore. The widget is worth it if you
want the number visible without unlocking — otherwise the notification covers
most of the value for none of the setup.
