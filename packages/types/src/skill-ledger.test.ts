import { describe, it, expect } from "vitest";
import { computeSkillLevel, barFit, type Evidence } from "./skill-ledger";

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const ev = (level: number, weight: number, ageDays: number, halfLife = 180): Evidence => ({
  level, weight, createdAt: daysAgo(ageDays), decayHalfLifeDays: halfLife,
});

describe("skill ledger — decay-weighted level", () => {
  it("empty evidence returns null (never a fabricated 0)", () => {
    expect(computeSkillLevel([])).toBeNull();
  });

  it("a single fresh evidence yields its level", () => {
    expect(computeSkillLevel([ev(80, 1, 0)])!.level).toBe(80);
  });

  it("recent evidence dominates older evidence", () => {
    // Old low + fresh high → weighted toward fresh.
    const r = computeSkillLevel([ev(30, 1, 300), ev(90, 1, 1)])!;
    expect(r.level).toBeGreaterThan(75);
    expect(r.evidenceCount).toBe(2);
  });

  it("higher-trust weight pulls the average", () => {
    // Same age, level 40 @ w0.5 (lesson) vs level 90 @ w1.2 (judged) → nearer 90.
    const r = computeSkillLevel([ev(40, 0.5, 5), ev(90, 1.2, 5)])!;
    expect(r.level).toBeGreaterThan(70);
  });

  it("evidence decays toward stale over multiple half-lives", () => {
    const fresh = computeSkillLevel([ev(90, 1, 0)])!.level;
    // Two lots: an old strong signal + a recent weak one — decay lets recent win.
    const decayed = computeSkillLevel([ev(90, 1, 360, 180), ev(40, 1, 0)])!;
    expect(fresh).toBe(90);
    expect(decayed.level).toBeLessThan(70); // the stale 90 lost ~75% of its weight
  });
});

describe("skill ledger — role bar fit", () => {
  const bar = [
    { skillId: "dsa", requiredLevel: 80, weight: 2 },
    { skillId: "sql", requiredLevel: 60, weight: 1 },
    { skillId: "react", requiredLevel: 70, weight: 1 },
  ];

  it("empty bar → 0, no gaps", () => {
    expect(barFit([{ skillId: "x", level: 90 }], [])).toEqual({ overall: 0, gaps: [] });
  });

  it("a missing skill is a gap at level 0, not an omission", () => {
    const { gaps } = barFit([{ skillId: "dsa", level: 80 }], bar);
    const react = gaps.find((g) => g.skillId === "react")!;
    expect(react).toMatchObject({ level: 0, required: 70, gap: 70, met: false });
  });

  it("gaps are sorted worst-first — the planner's input", () => {
    const { gaps } = barFit([{ skillId: "dsa", level: 40 }, { skillId: "sql", level: 55 }], bar);
    expect(gaps.map((g) => g.skillId)).toEqual(["react", "dsa", "sql"]); // 70, 40, 5
  });

  it("clearing every bar gives ~100 overall", () => {
    const { overall, gaps } = barFit(
      [{ skillId: "dsa", level: 85 }, { skillId: "sql", level: 70 }, { skillId: "react", level: 75 }],
      bar,
    );
    expect(overall).toBe(100);
    expect(gaps.every((g) => g.met)).toBe(true);
  });

  it("weight matters: the heavy skill moves overall more than a light one", () => {
    // Clearing only dsa (weight 2) beats clearing only sql (weight 1).
    const dsaOnly = barFit([{ skillId: "dsa", level: 80 }, { skillId: "sql", level: 0 }, { skillId: "react", level: 0 }], bar).overall;
    const sqlOnly = barFit([{ skillId: "dsa", level: 0 }, { skillId: "sql", level: 60 }, { skillId: "react", level: 0 }], bar).overall;
    expect(dsaOnly).toBeGreaterThan(sqlOnly); // 2/4=50 vs 1/4=25
    expect(dsaOnly).toBe(50);
    expect(sqlOnly).toBe(25);
  });
});
