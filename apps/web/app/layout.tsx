import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ClerkProvider } from "@clerk/nextjs";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { SwrProvider } from "@/components/swr-provider";
import { ConfirmProvider } from "@/components/confirm";
import { themeScript } from "@/components/theme";
import { ConsentBanner } from "@/components/consent-banner";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "EYF — Engineer Your Future", template: "%s · EYF" },
  description:
    "India's end-to-end placement operating system. DSA, core CS, mock interviews, mentors, projects, jobs — one platform from Day 1 of college to your first offer letter.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192" }, { url: "/icon-512.png", sizes: "512x512" }],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "EYF" },
  openGraph: {
    title: "EYF — Engineer Your Future",
    description: "One score for your entire placement prep — DSA, interviews, aptitude, resume, projects. India's placement OS.",
    type: "website",
    siteName: "EYF",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "EYF — one score for your entire placement prep" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "EYF — Engineer Your Future",
    description: "One score for your entire placement prep. India's placement OS.",
    images: ["/og.png"],
  },
};

export const viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

const PK = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const HAS_REAL_CLERK = !!PK && PK !== "pk_test_replace" && PK !== "pk_test_ZGV2LnBsYWNlaG9sZGVyLmNsZXJrLmFjY291bnRzLmRldiQ";

// Point Clerk at the app's theme tokens instead of fixed hex. These were
// hardcoded dark (#FAFAF9 text on #111111 inputs) and applied at the PROVIDER
// level, so they won every theme: in light mode Clerk rendered near-white text
// and a near-black input inside a white card — an unreadable sign-in page. The
// tokens below are re-resolved by CSS whenever the <html> theme class flips, so
// this needs no JS and cannot go stale.
const clerkAppearance = {
  variables: {
    // `colorPrimary` must be a colour Clerk can PARSE — it derives the button's
    // hover/active shades from it, and a `rgb(var(--token))` value fails that parse
    // and degrades to a transparent button (white-on-white on the light card).
    // Clerk also emits the button background with `!important`, which beats both a
    // utility class and an inline style, so this variable is the only lever.
    //
    // This provider is a server component and cannot read the visitor's theme, so
    // the value must work on both surfaces. Brand red does: it is the design
    // system's single accent, and white-on-brand measures 5.2:1 (AA) either way.
    colorPrimary: "#D6182A",
    colorBackground: "rgb(var(--surface))",
    colorText: "rgb(var(--text-1))",
    colorTextSecondary: "rgb(var(--text-3))",
    colorInputBackground: "rgb(var(--surface-2))",
    colorInputText: "rgb(var(--text-1))",
  },
};

function Shell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`dark ${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <SwrProvider><AnalyticsProvider><ConfirmProvider>{children}</ConfirmProvider></AnalyticsProvider></SwrProvider>
        <ConsentBanner />
        <Toaster position="bottom-right" richColors closeButton
          toastOptions={{
            style: {
              background: "rgb(var(--surface))",
              border: "1px solid rgb(var(--border))",
              color: "rgb(var(--text-1))",
            },
          }}
        />
      </body>
    </html>
  );
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Without real Clerk keys, render without ClerkProvider so the public site
  // works for development. Auth-gated pages will surface their own prompt.
  if (!HAS_REAL_CLERK) return <Shell>{children}</Shell>;
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <Shell>{children}</Shell>
    </ClerkProvider>
  );
}
