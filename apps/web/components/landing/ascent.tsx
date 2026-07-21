"use client";
import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  type MotionValue,
} from "framer-motion";
import { useIsReduced } from "@/lib/use-is-reduced";
import { ReadinessGauge } from "./readiness-gauge";
import { MagneticLink } from "./magnetic-link";

/** The Day-1 → Offer journey. Real placement milestones, not decorative numbers. */
const MILES = [
  { at: 0.0, label: "Day 1", sub: "College" },
  { at: 0.2, label: "First 100", sub: "DSA solved" },
  { at: 0.38, label: "Core CS", sub: "OS · DBMS · CN" },
  { at: 0.56, label: "First mock", sub: "AI interview" },
  { at: 0.74, label: "Resume", sub: "ATS-ready" },
  { at: 0.9, label: "Offer", sub: "Placed" },
];

function Milestone({ m, progress }: Readonly<{ m: (typeof MILES)[number]; progress: MotionValue<number> }>) {
  // milestones are keyed to the climb, which completes at 0.8 → scale their `at`
  const hit = m.at * 0.8;
  const lit = useTransform(progress, [hit - 0.03, hit + 0.01], [0.28, 1]);
  const dotScale = useTransform(progress, [hit - 0.03, hit + 0.01], [0.7, 1]);
  return (
    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-center" style={{ left: `${m.at * 100}%` }}>
      <motion.div style={{ scale: dotScale, opacity: lit }} className="mx-auto h-2.5 w-2.5 rounded-full bg-current" />
      <motion.div style={{ opacity: lit }} className="mt-3 whitespace-nowrap">
        <div className="font-brand text-sm font-bold leading-none">{m.label}</div>
        <div className="mt-1 font-mono text-[9px] uppercase tracking-wider opacity-55">{m.sub}</div>
      </motion.div>
    </div>
  );
}

export function Ascent() {
  const reduce = useIsReduced();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // The entire climb happens on ink; the ground flips to morning only at the end.
  // Spring-weight the number so it eases and "catches up" to the scroll rather
  // than tracking it 1:1 — reads as an instrument settling, not a raw readout.
  const rawValue = useTransform(scrollYProgress, [0.04, 0.8], [41, 92]);
  const value = useSpring(rawValue, { stiffness: 90, damping: 24, mass: 0.6 });
  const fill = useTransform(scrollYProgress, [0, 0.8], ["0%", "100%"]);
  const markerX = useTransform(scrollYProgress, [0, 0.8], ["0%", "100%"]);
  const journeyOpacity = useTransform(scrollYProgress, [0.8, 0.92], [1, 0]);
  const offerOpacity = useTransform(scrollYProgress, [0.86, 0.995], [0, 1]);
  const offerY = useTransform(scrollYProgress, [0.86, 0.995], [26, 0]);
  const full = useMotionValue(92); // static end-state for reduced motion

  if (reduce) {
    return (
      <section id="ascent" className="bg-[rgb(var(--lp-paper))] px-6 py-24 text-[rgb(var(--lp-ink))]">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] opacity-60">The ascent</p>
          <h2 className="mt-4 font-brand text-4xl font-extrabold tracking-tight">From day one to your first offer.</h2>
          <div className="mt-10 flex justify-center"><ReadinessGauge value={full} /></div>
          <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3 font-mono text-xs uppercase tracking-wider">
            {MILES.map((m) => <span key={m.label} className="opacity-80">{m.label}</span>)}
          </div>
          <div className="mt-14 flex justify-center"><OfferCard /></div>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} id="ascent" style={{ height: "360vh" }} className="relative z-10 text-[rgb(var(--lp-ink))]">
      <div className="sticky top-0 z-10 flex h-screen flex-col overflow-hidden">
        {/* header */}
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-10 pt-24">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] opacity-60">The ascent</p>
          <h2 className="mt-3 font-brand font-extrabold tracking-tight leading-[0.98]" style={{ fontSize: "clamp(2rem, 4.4vw, 3.4rem)" }}>
            From day one to your first offer.
          </h2>
        </div>

        {/* center: the instrument climbing */}
        <motion.div style={{ opacity: journeyOpacity }} className="relative flex flex-1 items-center justify-center">
          <ReadinessGauge value={value} />
        </motion.div>

        {/* the track */}
        <motion.div style={{ opacity: journeyOpacity }} className="mx-auto w-full max-w-6xl px-6 sm:px-10 pb-20">
          <div className="relative h-px w-full bg-black/12">
            <motion.div className="absolute left-0 top-0 h-px bg-[rgb(var(--lp-brand))]" style={{ width: fill }} />
            <motion.div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-[rgb(var(--lp-brand))] ring-4 ring-[rgb(var(--lp-brand))]/25" style={{ left: markerX }} />
            <div className="relative h-24">
              {MILES.map((m) => <Milestone key={m.label} m={m} progress={scrollYProgress} />)}
            </div>
          </div>
        </motion.div>

        {/* offer resolve on the risen morning ground */}
        <motion.div style={{ opacity: offerOpacity, y: offerY }} className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
          <OfferCard />
        </motion.div>
      </div>
    </section>
  );
}

function OfferCard() {
  return (
    <div className="pointer-events-auto w-full max-w-md overflow-hidden rounded-2xl border border-black/10 bg-white text-[rgb(var(--lp-ink))] shadow-[0_44px_100px_-34px_rgba(11,13,19,0.45)]">
      {/* letterhead */}
      <div className="flex items-center justify-between border-b border-black/[0.07] px-7 py-4">
        <span className="font-brand text-sm font-extrabold tracking-tight">
          EYF<span className="text-[rgb(var(--lp-brand))]">.</span>
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[rgb(var(--lp-ink))]/40">Offer letter · verified</span>
      </div>

      <div className="px-7 py-6">
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[rgb(var(--lp-placed))]">Congratulations</div>
            <div className="mt-2.5 font-brand text-2xl font-extrabold leading-[1.05] tracking-tight">
              Software Engineer,<br />SDE-1
            </div>
            <div className="mt-2 text-sm text-[rgb(var(--lp-ink))]/55">On-campus · joining after finals</div>
          </div>
          {/* placed seal */}
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-[rgb(var(--lp-placed))]/30 bg-[rgb(var(--lp-placed))]/10 text-[rgb(var(--lp-placed))]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
        </div>

        <div className="mt-6 flex items-end justify-between border-t border-black/[0.07] pt-5">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-45">Package</div>
            <div className="font-mono text-3xl font-semibold tabular-nums leading-none">
              ₹18<span className="ml-1 text-lg opacity-55">LPA</span>
            </div>
          </div>
          <MagneticLink
            href="/dashboard"
            strength={0.5}
            className="rounded-full bg-[rgb(var(--lp-ink))] px-5 py-2.5 text-sm font-semibold text-white transition-[filter] hover:brightness-110"
          >
            Start your path →
          </MagneticLink>
        </div>
      </div>
    </div>
  );
}
