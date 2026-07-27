"use client";
import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { HAS_REAL_CLERK } from "@/lib/auth";
import { useTheme } from "@/components/theme";

export default function Page() {
  const { theme } = useTheme();
  // Without real Clerk keys the app runs in dev-login mode and Clerk's
  // components crash (no ClerkProvider). Render a clear card instead of a 500.
  if (!HAS_REAL_CLERK) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-card">
          <div className="font-display text-2xl font-bold tracking-tight">EYF<span className="text-brand">.</span></div>
          <h1 className="font-display text-xl font-bold mt-6">Dev mode — no sign-up needed</h1>
          <p className="text-text-3 text-sm mt-2 leading-relaxed">
            This environment runs without Clerk keys, so you&apos;re signed in automatically as a dev user.
          </p>
          <Link href="/dashboard" className="mt-6 inline-flex h-11 items-center rounded-md bg-accent px-6 text-sm font-medium text-accent-ink hover:bg-accent-hover transition-colors">
            Continue to dashboard →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16">
      {/* `key` forces a remount when the theme flips — see the note in the sign-in
          page: Clerk applies baseTheme at MOUNT, and SSR always renders dark first,
          so without this the light-mode widget keeps its dark internals. */}
      <SignUp key={theme} appearance={{ baseTheme: theme === "dark" ? dark : undefined, elements: { card: "bg-surface border border-border" } }} />
    </div>
  );
}
