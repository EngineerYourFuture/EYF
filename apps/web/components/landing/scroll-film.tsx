"use client";
/**
 * EYF Landing — the scroll film (spec Doc 03). Nine scenes, one idea each,
 * scroll-driven with Framer Motion. Three.js particle field + 3D roadmap.
 * Physics-based springs, slow for story (600–1200ms feel via scroll scrub).
 */
import { useRef, type ReactNode } from "react";
import Link from "next/link";
import {
  motion, useScroll, useTransform, useSpring, useReducedMotion, type MotionValue,
} from "framer-motion";
import { Button, Badge } from "@eyf/ui";
import { Roadmap3D, ROADMAP_NODES } from "./roadmap-3d";
import { VideoHero } from "./video-hero";

/**
 * Scroll-linked vertical parallax. The element drifts from +speed to -speed (px)
 * as it travels through the viewport, so layered elements move at different
 * rates and the page gains depth. Disabled for reduced-motion.
 */
function Parallax({ children, speed = 60, className }: { children: ReactNode; speed?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [speed, -speed]);
  return (
    <motion.div ref={ref} style={reduce ? undefined : { y }} className={className}>
      {children}
    </motion.div>
  );
}

// ─── Scene 2 — THE DIAGNOSIS ──────────────────────────────────────
function Diagnosis() {
  return (
    <section className="relative min-h-[68vh] lg:min-h-[80vh] flex items-center justify-center px-6 py-12 overflow-hidden">
      <div className="max-w-3xl">
        <Parallax speed={40}><Stat n="300" suffix=" problems solved." /></Parallax>
        <Parallax speed={100}><Stat n="0" suffix=" offers received." accentZero /></Parallax>
        <Parallax speed={20}>
          <motion.p className="mt-10 text-text-3 text-xl leading-relaxed max-w-2xl"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}>
            Most students don&apos;t fail because they don&apos;t work hard. They fail because they prepare without direction.
          </motion.p>
        </Parallax>
      </div>
    </section>
  );
}
function Stat({ n, suffix, accentZero }: { n: string; suffix: string; accentZero?: boolean }) {
  return (
    <motion.div className="font-display font-bold leading-tight" style={{ fontSize: "clamp(2.5rem, 8vw, 6rem)" }}
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}>
      <span className={accentZero ? "text-hard" : "text-accent"}>{n}</span>
      <span className="text-text-1">{suffix}</span>
    </motion.div>
  );
}

// ─── Scene 3 — THE REVEAL (pinned scrub) ──────────────────────────
function Reveal() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 30 });
  // The mark scales down from oversized, de-blurs, holds, then drifts up + fades.
  const scale = useTransform(p, [0, 0.4, 0.72, 1], [1.4, 1, 1, 0.92]);
  const markOpacity = useTransform(p, [0, 0.22, 0.85, 1], [0, 1, 1, 0]);
  const markY = useTransform(p, [0, 1], ["10vh", "-12vh"]);
  const filter = useTransform(p, [0, 0.4], [18, 0], { clamp: true });
  const blur = useTransform(filter, (b) => `blur(${b}px)`);
  const subY = useTransform(p, [0.25, 0.65], [48, 0]);
  const subOpacity = useTransform(p, [0.3, 0.6], [0, 1]);
  const sweep = useTransform(p, [0.45, 0.85], ["0%", "100%"]);
  return (
    <section ref={ref} className="relative h-[135vh]">
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden">
        <motion.div style={reduce ? undefined : { scale, opacity: markOpacity, y: markY, filter: blur }}>
          <div className="font-display font-bold tracking-tight text-text-1" style={{ fontSize: "clamp(5rem, 22vw, 15rem)", lineHeight: 0.9 }}>
            EYF
          </div>
        </motion.div>
        <motion.div style={reduce ? undefined : { y: subY, opacity: subOpacity }} className="relative mt-2">
          <h2 className="font-display tracking-tight" style={{ fontSize: "clamp(1.75rem, 5vw, 3rem)", fontWeight: 300 }}>
            Engineer Your Future.
          </h2>
          <motion.div className="h-[2px] bg-brand absolute -bottom-2 left-0" style={{ width: reduce ? "100%" : sweep }} />
        </motion.div>
        <motion.p className="mt-6 text-text-3 text-lg" style={reduce ? undefined : { opacity: subOpacity }}>
          India&apos;s first placement operating system.
        </motion.p>
      </div>
    </section>
  );
}

// ─── Scene 4 — THE MAP (3D roadmap) ───────────────────────────────
function TheMap() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 30 });

  return (
    <section ref={ref} className="relative h-[150vh] lg:h-[230vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        <Roadmap3D progress={smooth} />
        <div className="absolute inset-0 grid lg:grid-cols-2 pointer-events-none">
          <div className="flex flex-col justify-center px-6 sm:px-8 lg:px-16">
            <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <Badge tone="accent" className="mb-6">The path</Badge>
              <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight leading-[1.05]">
                Most platforms give you content.<br />
                <span className="text-accent">EYF gives you a path.</span>
              </h2>
              <p className="mt-6 text-text-2 text-lg max-w-md leading-relaxed">
                Every student starts with a skill assessment. Every roadmap is generated for your timeline,
                your target company, and your exact gaps.
              </p>
              <NodeTicker progress={smooth} />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
function NodeTicker({ progress }: { progress: MotionValue<number> }) {
  const label = useTransform(progress, (v) => {
    const i = Math.min(ROADMAP_NODES.length - 1, Math.max(0, Math.floor(v * ROADMAP_NODES.length)));
    return ROADMAP_NODES[i] ?? ROADMAP_NODES[0]!;
  });
  return (
    <motion.div className="mt-8 font-mono text-sm text-text-3">
      <span className="text-accent">▸ </span>
      <motion.span>{label}</motion.span>
    </motion.div>
  );
}

// ─── Scene 5 — THE PROOF (horizontal pinned) ──────────────────────
const STUDENTS = [
  ["Rahul", "VIT Bhopal", "Amazon SDE-1"],
  ["Priya", "JNTU Hyderabad", "Razorpay"],
  ["Mohammed", "LNCT Bhopal", "Flipkart"],
  ["Sneha", "PCCoE Pune", "Swiggy"],
  ["Arjun", "AKTU Lucknow", "CRED"],
  ["Divya", "SRM Chennai", "Juspay"],
  ["Karan", "MIT Pune", "Zepto"],
  ["Anjali", "BNMIT Bangalore", "Freshworks"],
];
function Proof() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], ["2%", "-70%"]);
  return (
    <section ref={ref} className="relative h-[170vh] lg:h-[230vh]">
      <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">
        <div className="px-6 sm:px-8 lg:px-16 mb-10">
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">They started where you are.</h2>
        </div>
        <motion.div style={{ x }} className="flex gap-5 px-6 sm:px-8 lg:px-16">
          {STUDENTS.map(([name, college, company]) => (
            <div key={name} className="group shrink-0 w-72 rounded-xl border border-border bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_14px_44px_-16px_rgba(255, 255, 255,0.3)]">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-accent/30 bg-gradient-to-br from-accent/30 to-border font-display text-lg font-bold text-text-1">
                {name?.[0]}
              </div>
              <div className="mt-4 font-display text-lg font-bold">{name}</div>
              <div className="text-text-3 text-sm">{college}</div>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-tint px-3 py-1 text-sm">
                <span className="text-text-3">→</span>
                <span className="text-accent font-semibold">{company}</span>
              </div>
            </div>
          ))}
        </motion.div>
        <div className="px-6 sm:px-8 lg:px-16 mt-10">
          <p className="text-xl text-text-1">
            <span className="text-accent font-display font-bold text-3xl">73%</span>{" "}
            of EYF users who complete their track get placed within 3 months.
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Scene 6 — THE FEATURES ───────────────────────────────────────
const FEATURES = [
  { kicker: "DSA Engine", title: "Pattern-based. Not problem-based.",
    body: "EYF organises 2,000+ problems into 15 core patterns. After every solution, we generate 3 variants.",
    stat: "15 patterns cover 92% of all Indian OA questions.", icon: "tree" },
  { kicker: "Cognitive Games", title: "The round that eliminates 80% of students.",
    body: "EYF simulates TCS NQT, AMCAT, and Mettl with the exact interface and timing.",
    stat: "14 minutes remaining.", icon: "timer", urgent: true },
  { kicker: "AI Mock Interview", title: "Practice until the pressure disappears.",
    body: "Your anxiety index drops over four weeks of real, recorded practice.",
    stat: "Average anxiety index: 29 → 8 in 4 weeks.", icon: "wave" },
  { kicker: "Career Tracks", title: "Your role. Your curriculum. Your companies.",
    body: "Every student gets a week-by-week curriculum built for their exact target role.",
    stat: "12 roles. 12 distinct paths.", icon: "cards" },
];
function Features() {
  return (
    <section className="relative">
      {FEATURES.map((f, i) => (
        <div key={f.kicker} className="min-h-[68vh] lg:min-h-[84vh] flex items-center px-6 sm:px-8 lg:px-16 py-12">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center max-w-6xl mx-auto w-full">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-120px" }} transition={{ duration: 0.7 }}
              className={i % 2 ? "lg:order-2" : ""}>
              <Badge tone="accent" className="mb-5">{f.kicker}</Badge>
              <h3 className="font-display text-3xl md:text-4xl font-bold tracking-tight leading-tight">{f.title}</h3>
              <p className="mt-5 text-text-2 text-lg leading-relaxed max-w-md">{f.body}</p>
              <p className={`mt-6 font-mono text-sm ${f.urgent ? "text-hard" : "text-accent"}`}>{f.stat}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-120px" }} transition={{ duration: 0.8 }}
              className={`${i % 2 ? "lg:order-1" : ""} relative aspect-square overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface to-bg grid place-items-center`}>
              <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br from-accent/15 via-transparent to-transparent" />
              <div className="pointer-events-none absolute inset-0 opacity-[0.05]"
                style={{ backgroundImage: "radial-gradient(rgba(255, 255, 255,0.8) 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
              <Parallax speed={44} className="relative"><FeatureVisual icon={f.icon} /></Parallax>
            </motion.div>
          </div>
        </div>
      ))}
    </section>
  );
}
function FeatureVisual({ icon }: { icon: string }) {
  if (icon === "tree") {
    return (
      <motion.svg width="220" height="220" viewBox="-110 -10 220 220" animate={{ rotateY: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }} style={{ transformStyle: "preserve-3d" }}>
        {[[0, 20], [-50, 80], [50, 80], [-80, 140], [-20, 140], [20, 140], [80, 140]].flatMap((p, i, a) => {
          const parent = i === 0 ? null : a[Math.floor((i - 1) / 2)];
          return parent ? [<line key={`l${i}`} x1={parent[0]} y1={parent[1]} x2={p[0]} y2={p[1]} stroke="rgb(var(--accent) / 0.3)" strokeWidth="2" />] : [];
        })}
        {[[0, 20], [-50, 80], [50, 80], [-80, 140], [-20, 140], [20, 140], [80, 140]].map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="14" fill={i > 2 ? "rgb(var(--accent))" : "rgb(var(--surface))"} stroke="rgb(var(--accent))" strokeWidth="1.5" />
        ))}
      </motion.svg>
    );
  }
  if (icon === "timer") {
    return (
      <div className="text-center">
        <motion.div className="font-display text-6xl font-bold text-hard"
          animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1, repeat: Infinity }}>14:00</motion.div>
        <div className="text-text-3 text-sm mt-2 font-mono">minutes remaining</div>
      </div>
    );
  }
  if (icon === "wave") {
    return (
      <svg width="240" height="120" viewBox="0 0 240 120">
        {Array.from({ length: 40 }).map((_, i) => {
          const peak = Math.abs(Math.sin(i));
          return (
            <motion.rect key={i} x={i * 6} width="3" rx="1.5" fill="rgb(var(--accent))"
              height={8} y={56}
              initial={{ height: 8, y: 56 }}
              animate={{ height: [8, 8 + peak * 70, 8], y: [56, 56 - peak * 35, 56] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.03 }} />
          );
        })}
      </svg>
    );
  }
  return (
    <div className="relative w-48 h-48">
      {[0, 1, 2, 3].map((i) => (
        <motion.div key={i} className="absolute inset-0 rounded-xl bg-surface border border-accent/40"
          style={{ transformOrigin: "bottom center" }}
          animate={{ rotate: (i - 1.5) * 12, y: i * -4 }}
          transition={{ type: "spring", stiffness: 60 }} />
      ))}
    </div>
  );
}

// ─── Scene 7 — THE COMPARISON ─────────────────────────────────────
function Comparison() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start center", "center center"] });
  const collapse = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const emerge = useTransform(scrollYProgress, [0.3, 1], [0, 1]);
  const tools = ["LeetCode", "GFG", "YouTube", "Telegram", "PDFs", "Notion"];
  return (
    <section ref={ref} className="relative min-h-[64vh] lg:min-h-[78vh] flex items-center justify-center px-6 py-12">
      <div className="max-w-4xl w-full text-center">
        <motion.div style={{ opacity: collapse }} className="flex flex-wrap justify-center gap-3 mb-8">
          {tools.map((t, i) => (
            <motion.span key={t} className="px-4 py-2 border border-border rounded-md text-text-3 text-sm"
              animate={{ x: [0, (i % 2 ? 1 : -1) * 8, 0], rotate: [0, (i % 2 ? 2 : -2), 0] }}
              transition={{ duration: 3, repeat: Infinity }}>{t}</motion.span>
          ))}
        </motion.div>
        <motion.div style={{ opacity: collapse }} className="text-text-3 text-sm mb-12">Average student: 6 platforms, 0 direction.</motion.div>
        <motion.div style={{ opacity: emerge }}>
          <div className="inline-flex items-center gap-3 px-6 py-4 border border-accent/40 rounded-xl bg-accent-tint">
            <span className="text-accent font-display text-xl font-bold">One path.</span>
            <span className="text-text-2">From first concept to first offer.</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Scene 8 — PRICING ────────────────────────────────────────────
const TIERS = [
  { name: "Basic", price: "₹249", featured: false, items: ["20 submissions/day", "All core subjects", "Peer mocks"] },
  { name: "Pro", price: "₹499", featured: true, items: ["Unlimited", "AI mock interviews", "Resume ATS", "All problems"] },
  { name: "Elite", price: "₹899", featured: false, items: ["Everything in Pro", "2 expert mocks/mo", "Mentor priority"] },
];
function Pricing() {
  return (
    <section className="relative min-h-[88vh] flex items-center justify-center px-6 py-16">
      <div className="max-w-5xl w-full">
        <motion.h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-center max-w-2xl mx-auto leading-tight"
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          Two months of EYF Pro. Less than one day of offline coaching.
        </motion.h2>
        <div className="mt-14 grid md:grid-cols-3 gap-5 items-stretch">
          {TIERS.map((t, i) => (
            <motion.div key={t.name}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`rounded-xl p-7 border flex flex-col transition-transform duration-300 ${t.featured ? "border-accent bg-accent-tint scale-[1.04] shadow-[0_0_55px_-14px_rgba(255, 255, 255,0.45)]" : "border-border bg-surface hover:-translate-y-1"}`}>
              {t.featured && <Badge tone="accent" className="mb-3 w-fit">Most popular</Badge>}
              <div className="font-display text-xl font-bold">{t.name}</div>
              <div className="mt-2 font-display text-4xl font-bold">{t.price}<span className="text-base text-text-3">/mo</span></div>
              <ul className="mt-5 space-y-2 text-sm text-text-2 flex-1">
                {t.items.map((x) => <li key={x} className="flex gap-2"><span className="text-accent">▸</span>{x}</li>)}
              </ul>
              <Link href="/billing" className="mt-6"><Button className="w-full" variant={t.featured ? "primary" : "secondary"}>Choose {t.name}</Button></Link>
            </motion.div>
          ))}
        </div>
        <p className="text-center text-text-3 text-sm mt-10 font-mono">
          Offline coaching ₹1,20,000 · LeetCode ₹35,000/yr · <span className="text-accent">EYF Pro ₹3,999/yr</span>
        </p>
      </div>
    </section>
  );
}

// ─── Scene 9 — THE FINAL CTA (pinned scrub) ───────────────────────
function FinalCTA() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, { stiffness: 80, damping: 28 });
  const scale = useTransform(p, [0, 0.5], [0.82, 1]);
  const y = useTransform(p, [0, 0.5], [64, 0]);
  const opacity = useTransform(p, [0, 0.4], [0, 1]);
  const ctaOpacity = useTransform(p, [0.45, 0.7], [0, 1]);
  const ctaY = useTransform(p, [0.45, 0.75], [32, 0]);
  return (
    <section ref={ref} className="relative h-[125vh]">
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden">
        <motion.h2 className="font-display font-light tracking-tight leading-[1.05]" style={{ fontSize: "clamp(2.5rem, 9vw, 6rem)", ...(reduce ? {} : { scale, y, opacity }) }}>
          What&apos;s the cost<br />of not starting<br /><span className="text-brand">today?</span>
        </motion.h2>
        <motion.p className="mt-8 text-text-3 text-lg max-w-md" style={reduce ? undefined : { opacity }}>
          14,847 students are currently preparing on EYF. Some of them are competing for the same roles you are.
        </motion.p>
        <motion.div className="mt-10" style={reduce ? undefined : { opacity: ctaOpacity, y: ctaY }}>
          <Link href="/dashboard">
            <Button variant="brand" size="lg" className="text-base px-10">Start your path →</Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export function ScrollFilm() {
  return (
    <div className="relative">
      <VideoHero />
      <Diagnosis />
      <Reveal />
      <TheMap />
      <Proof />
      <Features />
      <Comparison />
      <Pricing />
      <FinalCTA />
    </div>
  );
}
