"use client";
/**
 * App-wide motion primitives — premium craft, not cinema. Fast (300-600ms),
 * once, reduced-motion safe. Use these to make the app feel alive without
 * slowing down a daily-use tool.
 */
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Fade + rise into view once. For sections and cards as they enter the viewport. */
export function Reveal({
  children, delay = 0, y = 16, className,
}: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
