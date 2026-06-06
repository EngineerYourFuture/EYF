"use client";
/**
 * Scene-aware nav (spec Doc 03 + line 481): hidden at the top of the film,
 * fades in with rgba(10,10,10,0.85) + backdrop-blur(16px) after 400px scroll.
 */
import Link from "next/link";
import { useScroll, useTransform, motion } from "framer-motion";
import { Button } from "@eyf/ui";

export function ScrollNav() {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [200, 400], [0, 1]);
  const y = useTransform(scrollY, [200, 400], [-12, 0]);

  return (
    <motion.header
      style={{ opacity, y }}
      className="fixed top-0 inset-x-0 z-50 border-b border-border/60"
    >
      <div className="absolute inset-0 bg-bg/85 backdrop-blur-xl -z-10" />
      <nav className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-display font-bold text-xl tracking-tight">EYF</Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-text-2">
          <Link href="/tracks" className="hover:text-text-1 transition-colors">Tracks</Link>
          <Link href="/problems" className="hover:text-text-1 transition-colors">Problems</Link>
          <Link href="/pricing" className="hover:text-text-1 transition-colors">Pricing</Link>
          <Link href="/mentors" className="hover:text-text-1 transition-colors">Mentors</Link>
        </div>
        <Link href="/dashboard"><Button size="sm">Start free</Button></Link>
      </nav>
    </motion.header>
  );
}
