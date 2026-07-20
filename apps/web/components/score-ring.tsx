"use client";
/**
 * ScoreRing — EYF's signature object. One animated ring, used everywhere the
 * score appears (dashboard strip, readiness hero, public share page, landing
 * teaser) so the brand has ONE recognisable visual. Draws in with a spring,
 * counts the number up in sync, and stays fully static under reduced motion.
 * Monochrome by design — the ring is near-white on dark, near-black on light;
 * red is reserved for the brand mark, per DESIGN.md.
 */
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useInView, animate } from "framer-motion";

type Props = {
  score: number;          // 0..100
  size?: number;          // px
  stroke?: number;        // px
  label?: string;         // under the number, e.g. "/ 100 ready"
  duration?: number;      // seconds
  /** Animate from this value instead of 0 — the "score moment": returning
   *  students watch the ring travel from their LAST score to today's. */
  from?: number;
  className?: string;
};

export function ScoreRing({ score, size = 192, stroke = 12, label = "/ 100 ready", duration = 1.4, from, className }: Readonly<Props>) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const start = Math.max(0, Math.min(100, from ?? 0));
  const [shown, setShown] = useState(reduce ? score : start);

  const radius = (size - stroke) / 2 - 2;
  const c = 2 * Math.PI * radius;
  const target = Math.max(0, Math.min(100, score));

  useEffect(() => {
    if (reduce) { setShown(target); return; }
    if (!inView) return;
    const controls = animate(start, target, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setShown(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, target, duration, reduce, start]);

  // Quarter ticks — faint wayfinding marks, not decoration.
  const ticks = [0, 90, 180, 270];

  return (
    <div ref={ref} className={`relative ${className ?? ""}`} style={{ width: size, height: size }} role="img" aria-label={`Score ${target} out of 100`}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} className="fill-none stroke-surface-3" strokeWidth={stroke} />
        {ticks.map((deg) => (
          <line
            key={deg}
            x1={size / 2 + (radius - stroke / 2 - 1) * Math.cos((deg * Math.PI) / 180)}
            y1={size / 2 + (radius - stroke / 2 - 1) * Math.sin((deg * Math.PI) / 180)}
            x2={size / 2 + (radius + stroke / 2 + 1) * Math.cos((deg * Math.PI) / 180)}
            y2={size / 2 + (radius + stroke / 2 + 1) * Math.sin((deg * Math.PI) / 180)}
            className="stroke-border-2"
            strokeWidth={1}
          />
        ))}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="fill-none stroke-accent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: reduce ? c - (c * target) / 100 : c - (c * start) / 100 }}
          animate={inView || reduce ? { strokeDashoffset: c - (c * target) / 100 } : undefined}
          transition={{ duration: reduce ? 0 : duration, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-bold leading-none tabular-nums" style={{ fontSize: size * 0.3 }}>{shown}</span>
        {label && <span className="text-text-3 font-mono mt-1" style={{ fontSize: Math.max(10, size * 0.055) }}>{label}</span>}
      </div>
    </div>
  );
}
