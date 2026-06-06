"use client";
import { motion } from "framer-motion";

/** Subtle fade-up on page mount — one job, fast (spec Doc 06: UI motion 150–200ms). */
export function PageMotion({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
