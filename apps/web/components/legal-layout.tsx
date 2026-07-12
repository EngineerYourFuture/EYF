import { type ReactNode } from "react";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

/** Shared shell for legal / policy pages (terms, privacy, refund, contact). */
export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen">
      <Nav />
      <section className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-text-1">{title}</h1>
        {updated && (
          <p className="mt-3 font-mono text-xs uppercase tracking-wider text-text-4">
            Last updated: {updated} · Engineer Your Future Private Limited
          </p>
        )}
        <div className="legal mt-8">{children}</div>
      </section>
      <Footer />
    </main>
  );
}
