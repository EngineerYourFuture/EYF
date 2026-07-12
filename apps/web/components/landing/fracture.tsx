"use client";
import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useIsReduced } from "@/lib/use-is-reduced";

/**
 * Scene 2 — "signals without a score." The fragmented reality of DIY placement
 * prep: ~10 authentic artifacts strewn off-grid, each drifting on its own loop
 * (anxiety as continuous, unsynchronised unrest), around a withheld question and
 * an empty gauge. As you scroll into the Ascent the fragments are *collected* —
 * they fly toward the centre and hand off to the instrument. Static + reduced-
 * motion: the pile renders in place, the question stands, nothing drifts.
 */
type Frag = { node: ReactNode; x: number; y: number; rot: number; d: number };

const FRAGS: Frag[] = [
  { node: <Card><b>Two&nbsp;Sum</b> <span className="text-[rgb(var(--lp-placed))]">✓</span> · Trapping Rain <span className="text-[rgb(var(--lp-brand))]">✗</span><div className="o">172 solved · no idea if it&rsquo;s enough</div></Card>, x: -330, y: -150, rot: -6, d: 7.5 },
  { node: <Bubble>bhai off-campus drive kaise apply karu 😭</Bubble>, x: 300, y: -180, rot: 5, d: 9 },
  { node: <Card><div className="o">resume_v7_FINAL_final(2).pdf</div></Card>, x: -360, y: 90, rot: 4, d: 8.2 },
  { node: <Card><b>Striver A2Z</b><div className="o">41% watched · paused 3 weeks ago</div></Card>, x: 330, y: 120, rot: -4, d: 10 },
  { node: <Sticky>Amazon OA tmrw?? revise DP</Sticky>, x: -140, y: -230, rot: -8, d: 6.8 },
  { node: <Card><div className="o">Companies_tracker.xlsx · 6 rows, 2 colours</div></Card>, x: 150, y: 210, rot: 6, d: 8.8 },
  { node: <Card><div className="o">&ldquo;how I cracked FAANG in 90 days&rdquo;</div></Card>, x: 380, y: -30, rot: -3, d: 9.4 },
  { node: <Search>am i too late for placements 3rd year</Search>, x: -300, y: 230, rot: 3, d: 7.2 },
  { node: <Card><b>CGPA 7.2</b> · 1 backlog</Card>, x: 30, y: 250, rot: -5, d: 8 },
  { node: <Card><b>LinkedIn</b><div className="o">500+ applied · 0 callbacks</div></Card>, x: -30, y: -120, rot: 7, d: 9.8 },
];

function Card({ children }: { children: ReactNode }) {
  return <div className="w-max max-w-[230px] rounded-lg border border-black/10 bg-white/70 px-3.5 py-2.5 text-[13px] leading-snug text-[rgb(var(--lp-ink))] shadow-sm backdrop-blur-sm [&_.o]:mt-0.5 [&_.o]:text-[11px] [&_.o]:text-[rgb(var(--lp-ink))]/45 [&_b]:font-semibold">{children}</div>;
}
function Bubble({ children }: { children: ReactNode }) {
  return <div className="w-[210px] rounded-2xl rounded-bl-sm bg-[#25D366]/12 border border-[#25D366]/40 px-3.5 py-2 text-[13px] leading-snug text-[rgb(var(--lp-ink))]/80 shadow-sm">{children}</div>;
}
function Sticky({ children }: { children: ReactNode }) {
  return <div className="w-[150px] rounded-sm bg-[rgb(var(--lp-brand))]/10 border border-[rgb(var(--lp-brand))]/30 px-3 py-2.5 font-mono text-[11px] leading-snug text-[rgb(var(--lp-ink))]/80 shadow-sm">{children}</div>;
}
function Search({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-2 whitespace-nowrap rounded-full border border-black/10 bg-white/70 px-4 py-2 text-[13px] text-[rgb(var(--lp-ink))]/75 shadow-sm"><span className="opacity-40">⌕</span>{children}</div>;
}

function Fragment({ f, progress, reduce }: { f: Frag; progress: MotionValue<number>; reduce: boolean }) {
  const cx = useTransform(progress, [0.42, 0.92], [f.x, 0]);
  const cy = useTransform(progress, [0.42, 0.92], [f.y, 0]);
  const op = useTransform(progress, [0.42, 0.86], [1, 0]);
  return (
    <motion.div
      className="absolute left-1/2 top-1/2"
      style={reduce ? { x: f.x, y: f.y } : { x: cx, y: cy, opacity: op }}
    >
      <motion.div
        style={{ rotate: f.rot }}
        animate={reduce ? undefined : { x: [0, 6, -4, 0], y: [0, -5, 3, 0] }}
        transition={reduce ? undefined : { duration: f.d, repeat: Infinity, ease: "easeInOut" }}
        className="-translate-x-1/2 -translate-y-1/2"
      >
        {f.node}
      </motion.div>
    </motion.div>
  );
}

export function Fracture() {
  const reduce = useIsReduced();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const askOpacity = useTransform(scrollYProgress, [0.36, 0.72], [1, 0]);

  return (
    <section ref={ref} className="relative z-10 h-[150vh] text-[rgb(var(--lp-ink))]">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden px-6">
        {/* the pile */}
        <div className="relative">
          {FRAGS.map((f, i) => <Fragment key={i} f={f} progress={scrollYProgress} reduce={!!reduce} />)}
        </div>

        {/* the withheld number */}
        <motion.div style={reduce ? undefined : { opacity: askOpacity }} className="relative z-10 text-center">
          <div className="mx-auto mb-6 h-28 w-28 rounded-full border border-dashed border-black/20 bg-[rgb(var(--lp-paper))]/70" aria-hidden />
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-[rgb(var(--lp-ink))]/45">You&rsquo;ve done so much</div>
          <h2 className="mt-3 font-brand text-4xl font-extrabold tracking-tight sm:text-5xl">Am I ready?</h2>
          <p className="mt-3 font-mono text-xs uppercase tracking-widest text-[rgb(var(--lp-ink))]/40">No one ever tells you.</p>
        </motion.div>
      </div>
    </section>
  );
}
