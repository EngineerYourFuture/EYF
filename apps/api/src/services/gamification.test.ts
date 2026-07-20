import { describe, it, expect } from "vitest";
import { badgesToUnlock } from "./gamification.js";

describe("badgesToUnlock", () => {
  it("unlocks nothing for a brand-new user", () => {
    expect(badgesToUnlock({ acceptedCount: 0, hardCount: 0, streakDays: 0 })).toEqual([]);
  });

  it("unlocks first-blood at the first accepted solve", () => {
    expect(badgesToUnlock({ acceptedCount: 1, hardCount: 0, streakDays: 0 })).toEqual(["first-blood"]);
  });

  it("stacks solve-count badges cumulatively", () => {
    expect(badgesToUnlock({ acceptedCount: 100, hardCount: 0, streakDays: 0 }))
      .toEqual(["first-blood", "ten-solved", "fifty-solved", "century"]);
  });

  it("unlocks hard-problem badges", () => {
    const b = badgesToUnlock({ acceptedCount: 5, hardCount: 10, streakDays: 0 });
    expect(b).toContain("first-hard");
    expect(b).toContain("hard-hitter");
  });

  it("unlocks streak badges at 7 and 30 days", () => {
    expect(badgesToUnlock({ acceptedCount: 1, hardCount: 0, streakDays: 7 })).toContain("week-warrior");
    expect(badgesToUnlock({ acceptedCount: 1, hardCount: 0, streakDays: 30 })).toContain("month-monk");
    expect(badgesToUnlock({ acceptedCount: 1, hardCount: 0, streakDays: 6 })).not.toContain("week-warrior");
  });
});
