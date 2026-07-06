"use client";
/**
 * AnimatedNumber — stats count up when they enter view, so dashboards feel
 * alive instead of printed. Tabular numerals prevent layout jitter; reduced
 * motion renders the final value immediately.
 */
import { useEffect, useRef, useState } from "react";
import { useReducedMotion, useInView, animate } from "framer-motion";

export function AnimatedNumber({ value, duration = 1 }: { value: number; duration?: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [shown, setShown] = useState(reduce ? value : 0);

  useEffect(() => {
    if (reduce) { setShown(value); return; }
    if (!inView) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setShown(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value, duration, reduce]);

  return <span ref={ref} className="tabular-nums">{shown.toLocaleString("en-IN")}</span>;
}
