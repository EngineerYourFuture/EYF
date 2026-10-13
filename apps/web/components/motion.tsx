"use client";
/**
 * App-wide motion primitives — premium craft, not cinema. Fast (300-600ms),
 * once, reduced-motion safe. Use these to make the app feel alive without
 * slowing down a daily-use tool.
 */
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { UI_FADE, UI_SPRING, useMotionPreference } from "./interaction-motion";


/** Fade + rise into view once. For sections and cards as they enter the viewport. */
export function Reveal({
  children, delay = 0, y = 16, className,
}: Readonly<{ children: ReactNode; delay?: number; y?: number; className?: string }>) {
  const reduce = useMotionPreference();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={reduce ? UI_FADE : { ...UI_SPRING, delay }}
    >
      {children}
    </motion.div>
  );
}
