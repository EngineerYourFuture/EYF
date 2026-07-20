import { describe, it, expect } from "vitest";
import { rankCohort, standingFor, type RankCandidate } from "./internship-ranking.js";

const c = (userId: string, score: number): RankCandidate => ({ userId, score });

describe("rankCohort", () => {
  it("orders by score descending", () => {
    const r = rankCohort([c("a", 10), c("b", 50), c("c", 30)]);
    expect(r.map((x) => x.userId)).toEqual(["b", "c", "a"]);
  });

  it("breaks score ties by userId ascending, deterministically", () => {
    const r = rankCohort([c("z", 40), c("a", 40), c("m", 40)]);
    expect(r.map((x) => x.userId)).toEqual(["a", "m", "z"]);
  });

  it("does not mutate the input array", () => {
    const input = [c("a", 1), c("b", 2)];
    rankCohort(input);
    expect(input.map((x) => x.userId)).toEqual(["a", "b"]);
  });

  it("handles an empty cohort", () => {
    expect(rankCohort([])).toEqual([]);
  });
});

describe("standingFor", () => {
  const cohort = [c("a", 90), c("b", 80), c("c", 70), c("d", 60), c("e", 50)];

  it("returns null when the user is not in the cohort", () => {
    expect(standingFor(cohort, 3, "ghost")).toBeNull();
  });

  it("marks a top-ranked user eligible with zero gap", () => {
    const s = standingFor(cohort, 3, "a")!;
    expect(s).toMatchObject({ rank: 1, cohortSize: 5, seats: 3, eligible: true, gapToCutoff: 0 });
  });

  it("marks the last seated user eligible (rank === seats)", () => {
    const s = standingFor(cohort, 3, "c")!;
    expect(s).toMatchObject({ rank: 3, eligible: true, cutoffScore: 70, gapToCutoff: 0 });
  });

  it("marks a below-cutoff user ineligible with the correct gap", () => {
    // cutoff is the 3rd-ranked score (70). User d has 60 → needs +10.
    const s = standingFor(cohort, 3, "d")!;
    expect(s).toMatchObject({ rank: 4, eligible: false, cutoffScore: 70, gapToCutoff: 10 });
  });

  it("treats everyone as eligible when seats ≥ cohort size (no cutoff)", () => {
    const s = standingFor(cohort, 5, "e")!;
    expect(s).toMatchObject({ eligible: true, cutoffScore: null, gapToCutoff: 0 });
    const s2 = standingFor(cohort, 99, "e")!;
    expect(s2).toMatchObject({ eligible: true, cutoffScore: null });
  });

  it("treats nobody as eligible when zero seats are open (no cutoff)", () => {
    const s = standingFor(cohort, 0, "a")!;
    expect(s).toMatchObject({ rank: 1, eligible: false, cutoffScore: null, gapToCutoff: 0 });
  });

  it("treats negative seats like zero seats", () => {
    const s = standingFor(cohort, -3, "a")!;
    expect(s).toMatchObject({ eligible: false, cutoffScore: null, gapToCutoff: 0 });
  });

  it("resolves cutoff eligibility deterministically across a score tie", () => {
    const tied = [c("a", 50), c("z", 50), c("m", 50)];
    // 1 seat, all tied at 50 → tie-break userId asc, so "a" gets it.
    expect(standingFor(tied, 1, "a")!).toMatchObject({ rank: 1, eligible: true });
    expect(standingFor(tied, 1, "z")!).toMatchObject({ rank: 3, eligible: false, gapToCutoff: 0 });
  });

  it("handles a single-member cohort", () => {
    expect(standingFor([c("solo", 42)], 1, "solo")!).toMatchObject({
      rank: 1, cohortSize: 1, eligible: true, cutoffScore: null,
    });
  });
});
