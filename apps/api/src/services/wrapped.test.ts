import { describe, it, expect } from "vitest";
import { Verdict } from "@eyf/db";
import { wrappedFrom, type WrappedInput } from "./wrapped.js";

const sol = (over: Partial<WrappedInput["solutions"][number]> = {}): WrappedInput["solutions"][number] => ({
  verdict: over.verdict ?? Verdict.ACCEPTED,
  language: over.language ?? "PYTHON",
  problem: over.problem ?? { difficulty: "MEDIUM", patterns: [] },
});
const input = (over: Partial<WrappedInput> = {}): WrappedInput => ({
  solutions: [], streaks: [], badges: 0, mocks: 0, profile: null, year: 2026, ...over,
});

describe("wrappedFrom — empty year", () => {
  it("returns a quiet-year headline and zeroed totals", () => {
    const w = wrappedFrom(input());
    expect(w.totalSolved).toBe(0);
    expect(w.topPattern).toBeNull();
    expect(w.primaryLanguage).toBeNull();
    expect(w.longestSession).toBeNull();
    expect(w.headline).toBe("A quiet year. Next one's yours.");
  });
});

describe("wrappedFrom — aggregation", () => {
  it("counts accepted by difficulty and picks top pattern + primary language", () => {
    const w = wrappedFrom(input({
      solutions: [
        sol({ language: "PYTHON", problem: { difficulty: "HARD", patterns: ["dp", "graphs"] } }),
        sol({ language: "PYTHON", problem: { difficulty: "EASY", patterns: ["dp"] } }),
        sol({ verdict: Verdict.WRONG_ANSWER, language: "JAVA", problem: { difficulty: "EASY", patterns: ["x"] } }),
      ],
      profile: { longestStreak: 12, currentXp: 500 },
    }));
    expect(w.totalSolved).toBe(2); // only accepted
    expect(w.totalSubmissions).toBe(3);
    expect(w.byDifficulty).toEqual({ HARD: 1, EASY: 1 });
    expect(w.topPattern).toBe("dp"); // appears twice
    expect(w.primaryLanguage).toBe("PYTHON");
    expect(w.bestStreakDays).toBe(12);
  });

  it("reports the longest session from the top streak day", () => {
    const w = wrappedFrom(input({
      streaks: [{ date: new Date("2026-03-15T00:00:00Z"), problemsSolved: 9 }],
    }));
    expect(w.longestSession).toEqual({ date: "2026-03-15", problemsSolved: 9 });
  });
});

describe("wrappedFrom — headline branches", () => {
  const solved = (n: number, extra: Partial<WrappedInput> = {}) =>
    wrappedFrom(input({ solutions: Array.from({ length: n }, () => sol()), ...extra })).headline;

  it("engine-started under 50 solved", () => {
    expect(solved(10)).toContain("engine started");
  });
  it("relentless when a 30+ day streak", () => {
    expect(wrappedFrom(input({
      solutions: Array.from({ length: 60 }, () => sol()),
      profile: { longestStreak: 30, currentXp: 0 },
    })).headline).toContain("Relentless");
  });
  it("mastery mention when there is a top pattern", () => {
    expect(wrappedFrom(input({
      solutions: Array.from({ length: 60 }, () => sol({ problem: { difficulty: "MEDIUM", patterns: ["trees"] } })),
    })).headline).toContain("trees");
  });
  it("falls back to a work headline with 50+ solved and no pattern/streak", () => {
    expect(solved(60)).toContain("that's work");
  });
});
