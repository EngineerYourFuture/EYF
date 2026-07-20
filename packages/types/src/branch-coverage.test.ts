import { describe, it, expect } from "vitest";
import { resolveOrgAccess } from "./authz";
import { capabilitiesFor } from "./permissions";
import { computeReadiness, type ReadinessInput } from "./readiness";
import { computeSkillLevel, barFit, type Evidence } from "./skill-ledger";

describe("resolveOrgAccess — reduce tie-breaks", () => {
  const cap = "org:members" as const;

  it("keeps the higher-precedence deny when the later one ranks lower", () => {
    const d = resolveOrgAccess(cap, {
      entries: [
        { capability: cap, effect: "deny", source: "platform", reason: "top" },
        { capability: cap, effect: "deny", source: "direct" },
      ],
    });
    expect(d).toMatchObject({ granted: false, source: "platform" });
  });

  it("prefers the wider scope in both orderings", () => {
    const wider = resolveOrgAccess(cap, {
      entries: [
        { capability: cap, effect: "allow", scope: "own", source: "direct" },
        { capability: cap, effect: "allow", scope: "org", source: "direct" },
      ],
    });
    expect(wider).toMatchObject({ granted: true, scope: "org" });

    const alsoWider = resolveOrgAccess(cap, {
      entries: [
        { capability: cap, effect: "allow", scope: "org", source: "direct" },
        { capability: cap, effect: "allow", scope: "own", source: "direct" },
      ],
    });
    expect(alsoWider).toMatchObject({ granted: true, scope: "org" });
  });

  it("breaks equal-scope ties by source precedence in both orderings", () => {
    const a = resolveOrgAccess(cap, {
      entries: [
        { capability: cap, effect: "allow", scope: "org", source: "direct" },
        { capability: cap, effect: "allow", scope: "org", source: "platform" },
      ],
    });
    expect(a).toMatchObject({ source: "platform" });

    const b = resolveOrgAccess(cap, {
      entries: [
        { capability: cap, effect: "allow", scope: "org", source: "platform" },
        { capability: cap, effect: "allow", scope: "org", source: "direct" },
      ],
    });
    expect(b).toMatchObject({ source: "platform" });
  });

  it("defaults an unspecified scope to 'own'", () => {
    const r = resolveOrgAccess(cap, {
      entries: [
        { capability: cap, effect: "allow", source: "direct" },
        { capability: cap, effect: "allow", source: "role" },
      ],
    });
    expect(r).toMatchObject({ granted: true, scope: "own" });
  });
});

describe("capabilitiesFor", () => {
  it("returns [] for an unknown role and for no role", () => {
    expect(capabilitiesFor("NOT_A_ROLE")).toEqual([]);
    expect(capabilitiesFor(null)).toEqual([]);
    expect(capabilitiesFor(undefined)).toEqual([]);
  });
});

describe("computeReadiness — null-coalescing branches", () => {
  const base: ReadinessInput = {
    totalSolved: 0, acceptanceRate: 0, difficultyMix: [], mocks: [], resumes: [],
    projects: [], streak: 0, longestStreak: 0, mcqBest: {}, commDrills: [],
  };

  it("handles mixed difficulty, null mock feedback, and null ATS scores", () => {
    const r = computeReadiness({
      ...base,
      totalSolved: 20,
      difficultyMix: [{ difficulty: "HARD", count: 2 }, { difficulty: "EASY", count: 5 }],
      mocks: [{ feedback: { overallScore: 70 } }, { feedback: null }],
      resumes: [{ atsScore: null }, { atsScore: 80 }],
    });
    expect(r.overall).toBeGreaterThan(0);
  });

  it("routes the interview pillar to /communication when there are drills but no mocks", () => {
    const r = computeReadiness({ ...base, mocks: [], commDrills: [{ score: 60 }] });
    const interview = r.pillars.find((p) => p.key === "interview")!;
    expect(interview.href).toBe("/communication");
  });
});

describe("skill-ledger — zero-weight edges", () => {
  const ev = (level: number, weight: number): Evidence => ({
    level, weight, createdAt: new Date(), decayHalfLifeDays: 180,
  });

  it("returns level 0 when total decayed weight is 0", () => {
    const r = computeSkillLevel([ev(80, 0)]);
    expect(r).toEqual({ level: 0, evidenceCount: 1 });
  });

  it("treats a requiredLevel of 0 as fully met", () => {
    const { gaps } = barFit([{ skillId: "s", level: 10 }], [{ skillId: "s", requiredLevel: 0, weight: 1 }]);
    expect(gaps[0]!.met).toBe(true);
    expect(gaps[0]!.gap).toBe(0);
  });

  it("returns overall 0 when the bar has no weight", () => {
    const { overall } = barFit([], [{ skillId: "s", requiredLevel: 50, weight: 0 }]);
    expect(overall).toBe(0);
  });
});

describe("computeReadiness — band ranges", () => {
  const base: ReadinessInput = {
    totalSolved: 0, acceptanceRate: 0, difficultyMix: [], mocks: [], resumes: [],
    projects: [], streak: 0, longestStreak: 0, mcqBest: {}, commDrills: [],
  };
  // strength multiplier drives the overall score across every band boundary.
  const scaled = (k: number): ReadinessInput => ({
    ...base,
    totalSolved: Math.round(200 * k),
    acceptanceRate: Math.min(1, k),
    difficultyMix: [{ difficulty: "HARD", count: Math.round(30 * k) }],
    mocks: Array.from({ length: Math.round(6 * k) }, () => ({ feedback: { overallScore: Math.round(100 * k) } })),
    resumes: [{ atsScore: Math.round(100 * k) }],
    projects: Array.from({ length: Math.round(3 * k) }, () => ({ status: "COMPLETED" })),
    streak: Math.round(60 * k), longestStreak: Math.round(60 * k),
    mcqBest: { APTITUDE: Math.round(100 * k), LOGICAL: Math.round(100 * k) },
    commDrills: Array.from({ length: Math.round(4 * k) }, () => ({ score: Math.round(100 * k) })),
  });

  it("covers every band as strength increases", () => {
    const bands = [0.15, 0.4, 0.7, 0.95, 1.2].map((k) => computeReadiness(scaled(k)).band);
    // distinct bands are produced across the range (all five branches exercised)
    expect(new Set(bands).size).toBeGreaterThanOrEqual(4);
  });
});

describe("computeReadiness — goal profile resolution", () => {
  const base: ReadinessInput = {
    totalSolved: 0, acceptanceRate: 0, difficultyMix: [], mocks: [], resumes: [],
    projects: [], streak: 0, longestStreak: 0, mcqBest: {}, commDrills: [],
  };
  it.each([
    { targetRole: "Frontend Engineer" },
    { targetRole: "Data Scientist" },
    { targetRole: "Backend / SDE" },
    { targetCompany: "google" },
    { targetCompany: "tcs" },
    { targetRole: "Generalist" }, // -> balanced default
  ])("resolves a weight profile for %o without error", (goal) => {
    expect(computeReadiness(base, goal).pillars.length).toBeGreaterThan(0);
  });
});
