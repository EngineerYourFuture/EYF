"use client";
/**
 * Premium video-first hero. Drop a looped, muted, cinematic file at
 * public/hero.mp4 (a poster frame at public/hero-poster.jpg) and flip
 * HERO_VIDEO below — until then an animated aurora carries the same feel.
 */
import { useRef, type ReactNode } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Button } from "@eyf/ui";
import { EyfAnimatedLogo } from "@/components/brand/eyf-animated-logo";

const HERO_VIDEO: string | null = null; // → "/hero.mp4" when the cinematic scroll video is ready

export function VideoHero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const reduce = useReducedMotion();
  const fade = useTransform(scrollYProgress, [0, 0.65, 1], [1, 1, 0], { clamp: true });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 90], { clamp: true });
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.12], { clamp: true });

  const line1 = "You've been preparing.".split(" ");
  const line2 = "You're still not getting placed.".split(" ");

  return (
    <section ref={ref} className="relative h-[110vh] lg:h-[140vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Background — video when provided, animated aurora otherwise */}
        <motion.div className="absolute inset-0" style={{ scale: reduce ? 1 : bgScale }}>
          {HERO_VIDEO ? (
            <video autoPlay loop muted playsInline poster="/hero-poster.jpg"
              className="absolute inset-0 h-full w-full object-cover">
              <source src={HERO_VIDEO} type="video/mp4" />
            </video>
          ) : (
            <Aurora reduce={!!reduce} />
          )}
        </motion.div>

        {/* Legibility overlays (light) — soft white scrim so text reads over the grid */}
        <div className="absolute inset-0 bg-bg/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-bg/50 via-transparent to-bg" />

        {/* Foreground */}
        <motion.div style={{ opacity: fade, y: reduce ? 0 : contentY }}
          className="relative h-full flex flex-col items-center justify-center px-6 text-center">
          {/* Brand — the animated iconic mark assembles on load. */}
          <EyfAnimatedLogo width={220} className="mb-4 w-[180px] sm:w-[220px]" />

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent-tint/50 px-4 py-1.5 text-[11px] font-mono uppercase tracking-[0.2em] text-accent">
            India&apos;s placement operating system
          </motion.div>

          <h1 className="font-display tracking-tight leading-[1.04] max-w-4xl"
            style={{ fontSize: "clamp(2.75rem, 8vw, 5.5rem)", letterSpacing: "-0.03em", fontWeight: 300 }}>
            <span className="block text-text-1">
              {line1.map((w, i) => <Word key={i} delay={i * 0.08}>{w}</Word>)}
            </span>
            <span className="block mt-2 text-text-3">
              {line2.map((w, i) => <Word key={i} delay={0.5 + i * 0.08}>{w}</Word>)}
            </span>
          </h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.25, duration: 0.8 }}
            className="mt-7 text-text-2 text-lg max-w-xl leading-relaxed">
            One platform that takes you from first concept to first offer — on a path built for your exact gaps.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.45, duration: 0.6 }}
            className="mt-9 flex flex-col items-center">
            <Link href="/dashboard">
              <Button variant="brand" size="lg" className="text-base px-9">Start your path →</Button>
            </Link>
            <div className="mt-4 text-text-4 text-xs font-mono">14,847 students preparing right now</div>
          </motion.div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div style={{ opacity: fade }} className="absolute bottom-10 left-1/2 -translate-x-1/2">
          <motion.div className="w-px h-10 bg-text-3 mx-auto"
            animate={reduce ? {} : { opacity: [0.2, 1, 0.2], scaleY: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }} />
        </motion.div>
      </div>
    </section>
  );
}

function Word({ children, delay }: { children: ReactNode; delay: number }) {
  return (
    <motion.span className="inline-block mr-[0.25em]"
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}>
      {children}
    </motion.span>
  );
}

function Aurora({ reduce }: { reduce: boolean }) {
  // Light hero — transparent so the LandingBackground grid corridor shows
  // through, with one soft cool wash drifting for a hint of depth/colour.
  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div className="absolute -top-[20%] left-1/2 -translate-x-1/2 h-[80vh] w-[80vh] rounded-full blur-[130px]"
        style={{ background: "radial-gradient(circle, rgba(120,140,200,0.14), transparent 62%)" }}
        animate={reduce ? {} : { x: [0, 40, -30, 0], y: [0, 30, 10, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }} />
    </div>
  );
}
