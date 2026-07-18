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

const clerkAppearance = {
  variables: {
    colorPrimary: "#F5F5F5",
    colorBackground: "#0A0A0A",
    colorText: "#FAFAF9",
    colorInputBackground: "#111111",
    colorInputText: "#FAFAF9",
  },
};

function Shell({ children }: { children: React.ReactNode }) {
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Without real Clerk keys, render without ClerkProvider so the public site
  // works for development. Auth-gated pages will surface their own prompt.
  if (!HAS_REAL_CLERK) return <Shell>{children}</Shell>;
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <Shell>{children}</Shell>
    </ClerkProvider>
  );
}
