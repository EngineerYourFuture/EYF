import { describe, it, expect } from "vitest";
import { computeReadiness, rankActions, type ReadinessInput } from "./readiness";

const empty: ReadinessInput = {
  totalSolved: 0, acceptanceRate: 0, difficultyMix: [], mocks: [], resumes: [],
  projects: [], streak: 0, longestStreak: 0, mcqBest: {}, commDrills: [],
};

describe("computeReadiness", () => {
  it("returns 0 overall and the starting band for a brand-new user", () => {
    const r = computeReadiness(empty);
    expect(r.overall).toBe(0);
    expect(r.band).toBe("Just getting started");
    expect(r.pillars).toHaveLength(6);
    expect(r.pillars.every((p) => p.score === 0)).toBe(true);
  });

  it("weights pillars into the overall score (deterministic)", () => {
    const r = computeReadiness({
      ...empty,
      totalSolved: 120, acceptanceRate: 0.8,
      difficultyMix: [{ difficulty: "HARD", count: 15 }],
    });
    // DSA maxed (weight .30) with nothing else should land overall in the ~27-30 range.
    expect(r.pillars.find((p) => p.key === "dsa")!.score).toBeGreaterThanOrEqual(90);
    expect(r.overall).toBeGreaterThan(20);
    expect(r.overall).toBeLessThan(35);
  });

  it("crosses band boundaries as signals accumulate", () => {
    const strong = computeReadiness({
      totalSolved: 200, acceptanceRate: 0.9,
      difficultyMix: [{ difficulty: "HARD", count: 30 }],
      mocks: [{ feedback: { overallScore: 90 } }, { feedback: { overallScore: 88 } },
              { feedback: { overallScore: 92 } }, { feedback: { overallScore: 85 } }],
      resumes: [{ atsScore: 95 }],
      projects: [{ status: "COMPLETED" }, { status: "COMPLETED" }],
      streak: 21, longestStreak: 30,
      mcqBest: { APTITUDE: 90, LOGICAL: 88 },
      commDrills: [{ score: 85 }, { score: 90 }],
    });
    expect(strong.overall).toBeGreaterThanOrEqual(80);
    expect(["Almost placement-ready", "Placement-ready", "Getting interview-ready"]).toContain(strong.band);
  });
});

describe("rankActions", () => {
  it("gives a foundation-first ordering to a brand-new user", () => {
    const actions = rankActions(computeReadiness(empty));
    expect(actions.length).toBeGreaterThan(0);
    expect(actions[0]!.reason).toMatch(/start here/i);
    // Highest-weight weak pillar (DSA, .30) should lead.
    expect(actions[0]!.pillarKey).toBe("dsa");
  });

  it("orders by impact = weight x gap, and explains the top lever", () => {
    // DSA strong, everything else weak → DSA should NOT be the top action.
    const r = computeReadiness({
      ...empty,
      totalSolved: 120, acceptanceRate: 0.85,
      difficultyMix: [{ difficulty: "HARD", count: 15 }],
    });
    const actions = rankActions(r);
    expect(actions[0]!.pillarKey).not.toBe("dsa");
    expect(actions[0]!.reason).toMatch(/biggest lever/i);
    // impact is a positive integer for every returned action
    expect(actions.every((a) => Number.isInteger(a.impact) && a.impact >= 0)).toBe(true);
  });

  it("returns no actions when every pillar is already strong", () => {
    const r = computeReadiness(empty);
    // force all pillars to 95 to exercise the 'all strong' branch
    r.pillars.forEach((p) => { p.score = 95; });
    expect(rankActions(r)).toEqual([]);
  });

  it("respects the limit", () => {
    expect(rankActions(computeReadiness(empty), 2)).toHaveLength(2);
  });
});

describe("goal-adaptive readiness (the differentiator)", () => {
  // Strong aptitude, weak DSA, no interviews/projects yet.
  const aptitudeHeavy: ReadinessInput = {
    ...empty,
    totalSolved: 20, acceptanceRate: 0.6,
    mcqBest: { APTITUDE: 90, LOGICAL: 88 },
    streak: 10, longestStreak: 14,
  };

  it("scores the SAME stats higher for a service target than a product target", () => {
    const service = computeReadiness(aptitudeHeavy, { targetCompany: "TCS" });
    const product = computeReadiness(aptitudeHeavy, { targetCompany: "Google" });
    // An aptitude-heavy student is genuinely more ready for a service company.
    expect(service.overall).toBeGreaterThan(product.overall);
  });

  it("weights the DSA gap ~2x more toward a product target than a service one", () => {
    const product = rankActions(computeReadiness(aptitudeHeavy, { targetCompany: "Amazon" }));
    const service = rankActions(computeReadiness(aptitudeHeavy, { targetCompany: "Infosys" }));
    const dsaImpact = (as: typeof product) => as.find((a) => a.pillarKey === "dsa")?.impact ?? 0;
    // Same weak DSA, but it's a bigger lever for a product SDE role than a service one.
    expect(dsaImpact(product)).toBeGreaterThan(dsaImpact(service));
  });

  it("resolves the profile from the role when no company is set", () => {
    const fe = computeReadiness({ ...empty, projects: [{ status: "COMPLETED" }] }, { targetRole: "Frontend Engineer" });
    expect(fe.summary).toMatch(/frontend/i);
  });

  it("falls back to the balanced default when there's no goal", () => {
    expect(computeReadiness(aptitudeHeavy).overall).toBe(computeReadiness(aptitudeHeavy, {}).overall);
  });
});
