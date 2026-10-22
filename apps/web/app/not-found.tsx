import Link from "next/link";
import { Button } from "@eyf/ui";
import { IS_LMS, PORTAL_HOME } from "@/lib/portal";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg text-text-1 flex items-center justify-center px-6 relative overflow-hidden">
      <div className="relative text-center max-w-md">
        <div className="font-display text-[clamp(5rem,18vw,9rem)] font-bold leading-none tracking-tight text-accent">404</div>
        <h1 className="type-headline mt-2">This page didn&apos;t make the cut.</h1>
        <p className="text-text-3 mt-3 leading-relaxed">
          The link is broken or the page moved. Let&apos;s get you back to building.
        </p>
        <div className="mt-7 flex gap-3 justify-center flex-wrap">
          <Link href={PORTAL_HOME}><Button>{IS_LMS ? "Back to your workspace" : "Back to dashboard"}</Button></Link>
          {!IS_LMS && <Link href="/problems"><Button variant="secondary">Browse problems</Button></Link>}
        </div>
      </div>
    </div>
  );
}
