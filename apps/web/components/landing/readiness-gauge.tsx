"use client";
import { motion, useTransform, type MotionValue } from "framer-motion";

/**
 * The product's core idea made an instrument: one number for your whole
 * placement readiness. Driven by a MotionValue (0–100). Beyond a bare ring it
 * carries a live value indicator riding the arc tip and a band label that names
 * where you stand — so it reads as a measurement device, not a progress bar.
 * Colour crosses brand-red → placed-green only near the top (the earned payoff).
 */
const SIZE = 380;
const STROKE = 14;
const R = SIZE / 2 - STROKE - 30;
const C = 2 * Math.PI * R;
const TICKS = 72;
const CENTER = SIZE / 2;

const band = (v: number) =>
  v < 40 ? "Not ready yet" : v < 66 ? "Getting there" : v < 85 ? "Interview-ready" : "Placement-ready";

export function ReadinessGauge({
  value,
  label = "Placement readiness",
}: {
  value: MotionValue<number>;
  label?: string;
}) {
  const clamped = useTransform(value, (v) => Math.max(0, Math.min(100, v)));
  const offset = useTransform(clamped, (v) => C * (1 - v / 100));
  const stroke = useTransform(
    clamped,
    [0, 82, 94, 100],
    ["rgb(var(--lp-brand))", "rgb(var(--lp-brand))", "rgb(var(--lp-placed))", "rgb(var(--lp-placed))"],
  );
  const num = useTransform(clamped, (v) => Math.round(v));
  const bandLabel = useTransform(clamped, (v): string => band(v));
  // live indicator riding the arc tip (svg is rotated -90°, so angle 0 = top)
  const dotX = useTransform(clamped, (v) => CENTER + R * Math.cos((v / 100) * 2 * Math.PI));
  const dotY = useTransform(clamped, (v) => CENTER + R * Math.sin((v / 100) * 2 * Math.PI));

  return (
    <div className="relative select-none" style={{ width: SIZE, height: SIZE, maxWidth: "80vw", aspectRatio: "1" }}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full -rotate-90" aria-hidden>
        {Array.from({ length: TICKS }).map((_, i) => {
          const a = (i / TICKS) * 2 * Math.PI;
          const major = i % 6 === 0;
          const rOuter = SIZE / 2 - 6;
          const rInner = SIZE / 2 - (major ? 22 : 13);
          const r2 = (n: number) => Math.round(n * 100) / 100;
          return (
            <line
              key={i}
              x1={r2(CENTER + rInner * Math.cos(a))} y1={r2(CENTER + rInner * Math.sin(a))}
              x2={r2(CENTER + rOuter * Math.cos(a))} y2={r2(CENTER + rOuter * Math.sin(a))}
              stroke="currentColor" strokeWidth={major ? 1.5 : 0.75}
              className={major ? "opacity-35" : "opacity-15"}
            />
          );
        })}
        {/* track */}
        <circle cx={CENTER} cy={CENTER} r={R} fill="none" stroke="currentColor" strokeWidth={STROKE} className="opacity-[0.09]" />
        {/* value arc */}
        <motion.circle
          cx={CENTER} cy={CENTER} r={R} fill="none"
          stroke={stroke} strokeWidth={STROKE} strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={offset}
        />
        {/* live indicator riding the arc tip */}
        <motion.circle cx={dotX} cy={dotY} r={STROKE / 2 + 2.5} style={{ fill: stroke }} />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex items-start font-mono font-semibold tabular-nums leading-none tracking-tighter">
          <motion.span style={{ fontSize: SIZE * 0.32 }}>{num}</motion.span>
          <span className="mt-2 ml-1.5 opacity-35" style={{ fontSize: SIZE * 0.085 }}>/100</span>
        </div>
        <motion.div className="mt-1 font-brand text-sm font-bold tracking-tight" style={{ color: stroke }}>
          {bandLabel}
        </motion.div>
        <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.3em] opacity-45">{label}</div>
      </div>
    </div>
  );
}
