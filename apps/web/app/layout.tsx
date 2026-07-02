import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { themeScript } from "@/components/theme";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "EYF — Engineer Your Future",
  description:
    "India's end-to-end placement operating system. DSA, core CS, mock interviews, mentors, projects, jobs — one platform from Day 1 of college to your first offer letter.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "EYF — Engineer Your Future",
    description: "The placement OS for the 95% of engineering students everyone else ignores.",
    type: "website",
  },
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>
        <AnalyticsProvider>{children}</AnalyticsProvider>
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
