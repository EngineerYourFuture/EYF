import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Button } from "@eyf/ui";

// Isolated from nav.tsx so Clerk's auth() side-effects never load
// when Clerk keys are placeholders (see nav.tsx's HAS_REAL_CLERK guard).
export function AuthButtons() {
  return (
    <>
      <SignedOut>
        <Link href="/sign-in" className="text-sm text-text-2 hover:text-text-1">Sign in</Link>
        <Link href="/sign-up"><Button size="sm">Start free</Button></Link>
      </SignedOut>
      <SignedIn>
        <Link href="/dashboard"><Button size="sm">Dashboard</Button></Link>
      </SignedIn>
    </>
  );
}
