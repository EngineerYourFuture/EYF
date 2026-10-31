"use client";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@eyf/ui";

export default function ErrorPage({ error, reset }: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  useEffect(() => {
    // surface in dev / send to analytics in prod
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-bg text-text-1 flex items-center justify-center px-6 relative overflow-hidden">
      <div className="relative text-center max-w-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-hard/10 border border-hard/30 text-hard text-2xl">!</div>
        <h1 className="font-display text-2xl font-bold mt-5">Something broke on our end.</h1>
        <p className="text-text-3 mt-3 leading-relaxed">
          An unexpected error occurred. Try again — if it keeps happening, head back to the dashboard.
        </p>
        {error.digest && <p className="text-text-4 text-xs font-mono mt-3">ref: {error.digest}</p>}
        <div className="mt-7 flex gap-3 justify-center flex-wrap">
          <Button onClick={reset} glow>Try again</Button>
          <Link href="/dashboard"><Button variant="secondary">Back to dashboard</Button></Link>
        </div>
      </div>
    </div>
  );
}
