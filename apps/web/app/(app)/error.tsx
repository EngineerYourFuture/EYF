"use client";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@eyf/ui";
import { captureError } from "@/lib/analytics";

/** Error boundary scoped to /(app) — renders inside the shell so navigation
 *  survives, and reports the error to analytics/Sentry (via the API). */
export default function AppError({ error, reset }: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  useEffect(() => { captureError(error); }, [error]);

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-16 max-w-lg mx-auto text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-hard/30 bg-hard/10 text-hard">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 9v4M12 17h.01" />
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        </svg>
      </div>
      <h1 className="font-display text-xl font-bold mt-4">This page hit an error</h1>
      <p className="text-text-3 mt-2 leading-relaxed">
        Try again — if it keeps happening, head back to your dashboard and we&apos;ll look into it.
      </p>
      {error.digest && <p className="text-text-4 text-xs font-mono mt-3">ref: {error.digest}</p>}
      <div className="mt-6 flex gap-3 justify-center flex-wrap">
        <Button onClick={reset}>Try again</Button>
        <Link href="/dashboard"><Button variant="secondary">Back to dashboard</Button></Link>
      </div>
    </div>
  );
}
