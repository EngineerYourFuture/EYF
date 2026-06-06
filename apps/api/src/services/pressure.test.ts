import { describe, it, expect } from "vitest";
import { pressureBudget, summarizeAnxiety } from "./pressure.js";
import { Difficulty, PressureLevel } from "@eyf/db";

describe("pressureBudget", () => {
  it("NORMAL = base seconds per difficulty", () => {
    expect(pressureBudget(Difficulty.EASY,   PressureLevel.NORMAL)).toBe(15 * 60);
    expect(pressureBudget(Difficulty.MEDIUM, PressureLevel.NORMAL)).toBe(30 * 60);
    expect(pressureBudget(Difficulty.HARD,   PressureLevel.NORMAL)).toBe(45 * 60);
  });
  it("HIGH < NORMAL < LOW", () => {
    const hi = pressureBudget(Difficulty.MEDIUM, PressureLevel.HIGH);
    const no = pressureBudget(Difficulty.MEDIUM, PressureLevel.NORMAL);
    const lo = pressureBudget(Difficulty.MEDIUM, PressureLevel.LOW);
    expect(hi).toBeLessThan(no);
    expect(no).toBeLessThan(lo);
  });
  it("EXTREME halves the time", () => {
    expect(pressureBudget(Difficulty.MEDIUM, PressureLevel.EXTREME))
      .toBe(Math.round(30 * 60 * 0.5));
  });
});

describe("summarizeAnxiety", () => {
  it("computes negative delta for inoculation (after < before)", () => {
    const trend = summarizeAnxiety([
      { anxietyBefore: 8, anxietyAfter: 5, completed: true },
      { anxietyBefore: 7, anxietyAfter: 4, completed: true },
      { anxietyBefore: 6, anxietyAfter: 4, completed: false },
    ]);
    expect(trend.sessions).toBe(3);
    expect(trend.avgDelta).toBeLessThan(0);
    expect(Math.round(trend.completionRate * 100)).toBe(67);
  });

  it("zero sessions yields zeros, not NaN", () => {
    const trend = summarizeAnxiety([]);
    expect(trend).toEqual({ sessions: 0, avgDelta: 0, completionRate: 0 });
  });

  it("ignores rows missing before/after", () => {
    const trend = summarizeAnxiety([
      { anxietyBefore: null, anxietyAfter: 5, completed: true },
      { anxietyBefore: 5, anxietyAfter: null, completed: true },
    ]);
    expect(trend.avgDelta).toBe(0);
  });
});
