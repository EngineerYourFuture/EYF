"use client";
/**
 * Score memory — powers the "score moment". We remember the readiness score a
 * student last SAW (localStorage, per device) so on their next visit the ring
 * travels from that number to today's and a delta chip says what changed.
 * Progress you can watch happen is the retention loop made visible.
 */
const KEY = "eyf-last-seen-score";

export function lastSeenScore(): number | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : null;
  } catch {
    return null;
  }
}

export function rememberScore(score: number) {
  try { localStorage.setItem(KEY, String(Math.round(score))); } catch { /* private mode */ }
}

// The "from" anchor is captured ONCE per JS session (module singleton) —
// React strict-mode double-mounts and dashboard↔readiness navigation would
// otherwise consume the delta before anyone saw it.
let anchor: number | null | undefined;

/** Returns the score the student last saw (null on first visit) and records
 *  the new one. Stable within a session, so every caller sees the same delta. */
export function takeScoreDelta(current: number): { from: number | null; delta: number } {
  if (anchor === undefined) anchor = lastSeenScore();
  rememberScore(current);
  return { from: anchor, delta: anchor == null ? 0 : Math.round(current) - anchor };
}
