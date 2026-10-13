"use client";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { HAS_REAL_CLERK } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme";
import { AuthoringDrafts } from "./authoring-drafts";

export function LmsShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AuthoringDrafts><div className="min-h-screen bg-bg [&_button]:min-h-11">
    <a href="#lms-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-surface focus:p-3">Skip to content</a>
    <header className="border-b border-border bg-surface sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 min-h-16 flex flex-wrap items-center gap-3 py-2">
        <Link href="/orgs" className="min-h-11 inline-flex items-center gap-2 font-semibold text-lg tracking-tight">EYF <span className="text-text-2 font-normal">LMS</span></Link>
        <span className="hidden sm:block text-sm text-text-2 border-l border-border pl-4">Private learning workspace</span>
        <div className="ml-auto flex items-center gap-4"><ThemeToggle />{HAS_REAL_CLERK ? <UserButton /> : <span className="text-sm text-text-2">Local preview</span>}</div>
      </div>
    </header>
    <main id="lms-content" tabIndex={-1} className="min-w-0 focus:outline-none">{children}</main>
    <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-8 border-t border-border text-sm text-text-2">Access is assigned by your organization. Contact your administrator to change your role or restore access.</footer>
  </div></AuthoringDrafts>;
}
