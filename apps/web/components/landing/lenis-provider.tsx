"use client";
import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";

/**
 * Smooth-scroll provider for the marketing surface. Lenis normalises wheel/touch
 * input into an eased scroll position, which is what makes scroll-scrubbed
 * sequences feel intentional rather than jumpy. It's a pure enhancement — native
 * scrolling still works if it never mounts — and it fully bows out when the user
 * prefers reduced motion (no eased scroll, no rAF loop).
 */
export function LenisProvider({ children }: Readonly<{ children: ReactNode }>) {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => 1 - Math.pow(1 - t, 3), // easeOutCubic — quick then settle
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
    });

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
