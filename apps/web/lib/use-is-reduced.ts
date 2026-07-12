"use client";
import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * SSR-safe reduced-motion flag. `useReducedMotion()` returns null on the server
 * and the real value on the client, so branching on it directly produces a
 * hydration mismatch. This returns `false` on the server and first client render
 * (so both agree — the full animated version), then flips to the true preference
 * after mount. Reduced-motion users land on the static version a frame later,
 * with no hydration error.
 */
export function useIsReduced(): boolean {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? !!reduce : false;
}
