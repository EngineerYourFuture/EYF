import { describe, it, expect } from "vitest";
import { xpForLevel, levelForXp, SUBMISSION_LIMITS, RATE_LIMIT_PER_MIN, meetsPlan } from "./index.js";

describe("XP curve", () => {
  it("level 1 needs 0 XP", () => expect(xpForLevel(1)).toBe(0));
  it("level 2 needs 100 XP", () => expect(xpForLevel(2)).toBe(100));
  it("level 3 needs 300 XP", () => expect(xpForLevel(3)).toBe(300));
  it("levelForXp is the inverse of xpForLevel", () => {
    for (let l = 1; l <= 10; l++) {
      expect(levelForXp(xpForLevel(l))).toBe(l);
    }
  });
  it("levelForXp clamps to next-lower level for in-between XP", () => {
    expect(levelForXp(99)).toBe(1);
    expect(levelForXp(100)).toBe(2);
    expect(levelForXp(299)).toBe(2);
    expect(levelForXp(300)).toBe(3);
  });
});

describe("plan limits", () => {
  it("free is the most restrictive submission cap", () => {
    expect(SUBMISSION_LIMITS.free).toBeLessThan(SUBMISSION_LIMITS.basic);
    expect(SUBMISSION_LIMITS.pro).toBe(Number.POSITIVE_INFINITY);
    expect(SUBMISSION_LIMITS.elite).toBe(Number.POSITIVE_INFINITY);
  });

  it("rate limits scale with plan", () => {
    expect(RATE_LIMIT_PER_MIN.free).toBeLessThan(RATE_LIMIT_PER_MIN.basic);
    expect(RATE_LIMIT_PER_MIN.basic).toBeLessThan(RATE_LIMIT_PER_MIN.pro);
    expect(RATE_LIMIT_PER_MIN.pro).toBeLessThan(RATE_LIMIT_PER_MIN.elite);
  });
});

describe("meetsPlan (tier-rank gating)", () => {
  it("requirePlan(['pro']) means pro or above", () => {
    expect(meetsPlan("pro", ["pro"]).ok).toBe(true);
    expect(meetsPlan("elite", ["pro"]).ok).toBe(true);
    expect(meetsPlan("basic", ["pro"]).ok).toBe(false);
    expect(meetsPlan("free", ["pro"]).ok).toBe(false);
  });

  it("requirePlan(['basic']) lets pro and elite through (the old bug)", () => {
    expect(meetsPlan("basic", ["basic"]).ok).toBe(true);
    expect(meetsPlan("pro", ["basic"]).ok).toBe(true);
    expect(meetsPlan("elite", ["basic"]).ok).toBe(true);
    expect(meetsPlan("free", ["basic"]).ok).toBe(false);
  });

  it("uses the LOWEST listed tier as the minimum", () => {
    // ["pro","elite"] should gate at pro, so pro passes.
    expect(meetsPlan("pro", ["pro", "elite"]).ok).toBe(true);
  });

  it("returns the minimum required tier on failure", () => {
    const r = meetsPlan("free", ["pro", "elite"]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.minRequired).toBe("pro");
  });

  it("empty requirement always passes", () => {
    expect(meetsPlan("free", []).ok).toBe(true);
  });
});
