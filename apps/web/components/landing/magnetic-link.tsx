"use client";
import Link from "next/link";
import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useIsReduced } from "@/lib/use-is-reduced";

/**
 * Primary CTA with a subtle magnetic pull toward the cursor — the small detail
 * that rewards attention and reads as hand-built. Spring-damped so it feels
 * weighted, resets on leave, and is inert under prefers-reduced-motion. The
 * link inside stays a normal, keyboard-focusable anchor.
 */
export function MagneticLink({
  href,
  children,
  className,
  strength = 0.35,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const reduce = useIsReduced();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 16, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 16, mass: 0.4 });

  function onMove(e: React.MouseEvent) {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  }
  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={reduce ? undefined : { x: sx, y: sy }}
      className="inline-block"
    >
      <Link href={href} className={className}>
        {children}
      </Link>
    </motion.div>
  );
}
