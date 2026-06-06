/**
 * Pressure training — Phase 4 Week 26–27 per spec.
 *
 * Time budget per difficulty (base seconds), scaled by PressureLevel.
 * The "anxiety index" is the user's self-reported (before-after) delta,
 * surfaced as a trend to show inoculation working.
 */
import { type PressureLevel, Difficulty } from "@eyf/db";

const BASE_SECONDS: Record<Difficulty, number> = {
  [Difficulty.EASY]:   15 * 60,
  [Difficulty.MEDIUM]: 30 * 60,
  [Difficulty.HARD]:   45 * 60,
  [Difficulty.EXPERT]: 60 * 60,
};

const LEVEL_MULTIPLIER: Record<PressureLevel, number> = {
  LOW:     1.5,
  NORMAL:  1.0,
  HIGH:    0.7,
  EXTREME: 0.5,
};

export function pressureBudget(difficulty: Difficulty, level: PressureLevel): number {
  return Math.round(BASE_SECONDS[difficulty] * LEVEL_MULTIPLIER[level]);
}

export type AnxietyTrend = {
  sessions: number;
  avgDelta: number; // negative = anxiety dropping over time (good)
  completionRate: number;
};

export function summarizeAnxiety(
  rows: { anxietyBefore: number | null; anxietyAfter: number | null; completed: boolean }[],
): AnxietyTrend {
  const withBoth = rows.filter((r) => r.anxietyBefore != null && r.anxietyAfter != null);
  const avgDelta = withBoth.length
    ? withBoth.reduce((a, r) => a + (r.anxietyAfter! - r.anxietyBefore!), 0) / withBoth.length
    : 0;
  return {
    sessions: rows.length,
    avgDelta: Math.round(avgDelta * 10) / 10,
    completionRate: rows.length ? rows.filter((r) => r.completed).length / rows.length : 0,
  };
}
