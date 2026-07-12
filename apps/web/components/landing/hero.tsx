"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { MagneticLink } from "./magnetic-link";

const ease = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden text-[rgb(var(--lp-ink))]">
      {/* soft paper glow behind the text so copy stays readable over the shared ring */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{ background: "radial-gradient(closest-side at 50% 46%, rgb(var(--lp-paper) / 0.92) 30%, rgb(var(--lp-paper) / 0.4) 52%, transparent 72%)" }}
      />

      {/* nav */}
      <nav className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 sm:px-10 h-20">
        <Link href="/" className="font-brand text-xl font-extrabold tracking-tight">
          EYF<span className="text-[rgb(var(--lp-brand))]">.</span>
        </Link>
        <div className="flex items-center gap-6 font-mono text-xs uppercase tracking-widest">
          <Link href="/pricing" className="opacity-60 hover:opacity-100 transition-opacity hidden sm:inline">Pricing</Link>
          <Link href="/sign-in" className="opacity-60 hover:opacity-100 transition-opacity">Sign in</Link>
          <Link href="/sign-up" className="rounded-full border border-black/15 px-4 py-1.5 hover:border-black/40 transition-colors">Start free</Link>
        </div>
      </nav>

      {/* centred content, framed by the calm centre of the ring */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}
          className="font-mono text-[11px] uppercase tracking-[0.28em] text-[rgb(var(--lp-brand))]"
        >
          India&rsquo;s placement operating system
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.12, ease }}
          className="mt-6 font-brand font-extrabold leading-[0.98] tracking-[-0.02em] text-balance"
          style={{ fontSize: "clamp(2.6rem, 6.2vw, 5rem)" }}
        >
          You&rsquo;ve been preparing.
          <br />
          <span className="text-[rgb(var(--lp-ink))]/40">You&rsquo;re still not getting placed.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.5, ease }}
          className="mt-7 max-w-xl text-lg leading-relaxed text-[rgb(var(--lp-ink))]/65"
        >
          One platform — and <span className="text-[rgb(var(--lp-ink))]">one score</span> — from your first DSA
          problem to your first offer letter. Everything you do feeds it.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.7, ease }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <MagneticLink
            href="/dashboard"
            className="group inline-flex items-center gap-2 rounded-full bg-[rgb(var(--lp-brand))] px-8 py-4 text-sm font-semibold text-white transition-[filter] hover:brightness-95"
          >
            Start your path
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </MagneticLink>
          <Link href="/pricing" className="font-mono text-xs uppercase tracking-widest text-[rgb(var(--lp-ink))]/55 hover:text-[rgb(var(--lp-ink))] transition-colors">
            See pricing ↓
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
