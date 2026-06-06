import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@eyf/ui";

const PK = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const HAS_REAL_CLERK = !!PK && PK !== "pk_test_replace" && PK !== "pk_test_ZGV2LnBsYWNlaG9sZGVyLmNsZXJrLmFjY291bnRzLmRldiQ";

// Dynamically loaded so @clerk/nextjs is never imported when keys are placeholder.
const AuthButtons = HAS_REAL_CLERK
  ? dynamic(() => import("./nav-auth").then((m) => m.AuthButtons), { ssr: true })
  : null;

export function Nav() {
  return (
    <header className="border-b border-border sticky top-0 bg-bg/80 backdrop-blur-sm z-50">
      <nav className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-display font-bold text-xl tracking-tight">EYF</Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-text-2">
          <Link href="/tracks" className="hover:text-text-1 transition-colors">Tracks</Link>
          <Link href="/problems" className="hover:text-text-1 transition-colors">Problems</Link>
          <Link href="/pricing" className="hover:text-text-1 transition-colors">Pricing</Link>
          <Link href="/mentors" className="hover:text-text-1 transition-colors">Mentors</Link>
        </div>
        <div className="flex items-center gap-3">
          {AuthButtons
            ? <AuthButtons />
            : <Link href="/dashboard"><Button size="sm">Open dashboard</Button></Link>}
        </div>
      </nav>
    </header>
  );
}
