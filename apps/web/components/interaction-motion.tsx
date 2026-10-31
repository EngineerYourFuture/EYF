"use client";
import { useSyncExternalStore, type ReactNode } from "react";
import { MotionConfig } from "framer-motion";

/** Critically damped: quick to respond, with no decorative overshoot. */
export const UI_SPRING = { type: "spring", stiffness: 400, damping: 40, mass: 1 } as const;
export const UI_FADE = { duration: 0.16, ease: "easeOut" } as const;

const query = "(prefers-reduced-motion: reduce)";
function subscribe(notify: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
}

/** React to preference changes while EYF is open, including smooth scrolling. */
export function useMotionPreference() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => true);
}

export function MotionPreferences({ children }: Readonly<{ children: ReactNode }>) {
  const reduce = useMotionPreference();
  return <MotionConfig reducedMotion={reduce ? "always" : "never"}>{children}</MotionConfig>;
}
