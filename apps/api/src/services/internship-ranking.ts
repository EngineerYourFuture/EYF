/**
 * Merit-ranking for the internship flywheel (design doc: internship-driven LMS).
 *
 * Scarce, org-sourced Elite internship seats are rationed to the top students by
 * score. The cutoff is NOT a fixed number — it is the total count of OPEN Elite
 * slot seats, so a student's rank only matters against seats that actually exist.
 * That makes the "slots ÷ students" supply discipline automatic: source more
 * seats and more students clear the bar; source none and the bar closes.
 *
 * This module is pure and signal-agnostic: it ranks whatever numeric `score` the
 * caller supplies. v1 ranks on stored XP (cheap); the score source is expected to
 * become a materialized Readiness Index later (see TODOS HARD-6) without touching
 * this logic or its tests.
 *
 *   rank 1 ─┐
 *   rank 2  ├─ eligible  (rank ≤ seats)   seats = Σ open Elite slot seats
 *   ...     │
 *   rank N ─┘  ← cutoffScore = score at this last-eligible position
 *   rank N+1 ── not eligible; gapToCutoff = cutoffScore − yourScore
 */

export type RankCandidate = { userId: string; score: number };

export type InternshipStanding = {
  /** 1-based position in the ranked cohort. */
  rank: number;
  cohortSize: number;
  /** Open Elite slot seats — the eligibility cutoff. */
  seats: number;
  /** True when rank ≤ seats (you're in the seat zone). */
  eligible: boolean;
  /** The caller's own score. */
  score: number;
  /**
   * Score of the last student who gets a seat. null when everyone is eligible
   * (seats ≥ cohortSize) or no seats are open (seats ≤ 0) — no meaningful cutoff.
   */
  cutoffScore: number | null;
  /** Points needed to reach the cutoff; 0 when eligible or no cutoff exists. */
  gapToCutoff: number;
};

/**
 * Deterministic ranking: score desc, then userId asc so ties resolve stably
 * (the same cohort always produces the same order — no seat flip-flops between
 * requests). Returns a new array; does not mutate the input.
 */
export function rankCohort(candidates: readonly RankCandidate[]): RankCandidate[] {
  return [...candidates].sort((a, b) =>
    b.score - a.score || (a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0),
  );
}

/**
 * The caller's standing in the cohort given the open-seat cutoff.
 * Returns null when the user is not part of the ranked cohort (e.g. hasn't
 * consented to the talent pool) — the caller should prompt them to opt in.
 */
export function standingFor(
  candidates: readonly RankCandidate[],
  seats: number,
  userId: string,
): InternshipStanding | null {
  const ranked = rankCohort(candidates);
  const idx = ranked.findIndex((c) => c.userId === userId);
  if (idx === -1) return null;

  const cohortSize = ranked.length;
  const rank = idx + 1;
  const score = ranked[idx]!.score;
  const eligible = seats > 0 && rank <= seats;

  // A meaningful cutoff exists only when seats carve the cohort in two.
  const hasCutoff = seats > 0 && seats < cohortSize;
  const cutoffScore = hasCutoff ? ranked[seats - 1]!.score : null;
  const gapToCutoff = eligible || cutoffScore === null ? 0 : Math.max(0, cutoffScore - score);

  return { rank, cohortSize, seats, eligible, score, cutoffScore, gapToCutoff };
}
