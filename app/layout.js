import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Pwa from "./components/pwa";
import ThemeScript from "./components/theme-script";
import OfflineBanner from "./components/offline-banner";
import OutboxSync from "./components/outbox-sync";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Absolute base for the Open Graph / Twitter tags. An explicit
 * NEXT_PUBLIC_SITE_URL wins; otherwise Vercel's own production domain is used,
 * so a deployment emits real URLs even if nobody sets a variable.
 */
function resolveSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}

const siteUrl = resolveSiteUrl();

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: "traco — daily spending tracker",
  description:
    "Set a daily spending goal, log what you spend, and carry what you save into tomorrow.",
  appleWebApp: {
    capable: true,
    title: "traco",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    siteName: "traco",
    title: "traco — daily spending tracker",
    description:
      "Set a daily spending goal, log what you spend, and carry what you save into tomorrow.",
    url: "/",
  },
  twitter: {
    // No twitter-image file, so X falls back to the generated OG image.
    card: "summary_large_image",
    title: "traco — daily spending tracker",
    description:
      "Set a daily spending goal, log what you spend, and carry what you save into tomorrow.",
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0e13" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        {/* First in the body, and synchronous: the first paint is already the
            right theme rather than a default that swaps a frame later. */}
        <ThemeScript />
        {/*
          These live at the root, not in the authenticated layout, so that the
          offline notice and the pending-entry sync keep working even when a
          layout below fails because the network is gone.
        */}
        <Pwa />
        <OfflineBanner />
        <OutboxSync />
        {children}
      </body>
    </html>
  );
}
