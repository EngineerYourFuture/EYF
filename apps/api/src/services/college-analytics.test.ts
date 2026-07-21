import { describe, it, expect } from "vitest";
import { collegeBatchHealth, type StudentStat } from "./college-analytics.js";

const s = (o: Partial<StudentStat>): StudentStat => ({
  level: 1, currentXp: 0, streakDays: 0, totalSolved: 0, targetRole: null, graduationYear: null, ...o,
});

describe("collegeBatchHealth", () => {
  it("returns zeros for an empty batch (no divide-by-zero)", () => {
    expect(collegeBatchHealth([])).toEqual({
      students: 0, active: 0, engaged: 0, avgLevel: 0, avgXp: 0, avgSolved: 0,
      topTargetRoles: [], gradYears: [],
    });
  });

  it("counts active (solved > 0) and engaged (streak >= 7)", () => {
    const batch = [
      s({ totalSolved: 5, streakDays: 10 }),
      s({ totalSolved: 0, streakDays: 8 }), // engaged but not active
      s({ totalSolved: 3, streakDays: 2 }), // active but not engaged
      s({ totalSolved: 0, streakDays: 0 }), // neither
    ];
    const h = collegeBatchHealth(batch);
    expect(h).toMatchObject({ students: 4, active: 2, engaged: 2 });
  });

  it("averages level/xp/solved, rounded", () => {
    const h = collegeBatchHealth([
      s({ level: 3, currentXp: 100, totalSolved: 10 }),
      s({ level: 4, currentXp: 201, totalSolved: 15 }),
    ]);
    expect(h).toMatchObject({ avgLevel: 4, avgXp: 151, avgSolved: 13 }); // 3.5→4, 150.5→151, 12.5→13
  });

  it("returns the top 3 target roles, most-wanted first, ties broken by name", () => {
    const batch = [
      ...Array(3).fill(s({ targetRole: "SDE" })),
      ...Array(2).fill(s({ targetRole: "Data" })),
      s({ targetRole: "ML" }),
      s({ targetRole: "DevOps" }),
      s({ targetRole: null }), // ignored
    ];
    const h = collegeBatchHealth(batch);
    expect(h.topTargetRoles).toEqual([
      { role: "SDE", count: 3 },
      { role: "Data", count: 2 },
      { role: "DevOps", count: 1 }, // tie at 1 → alphabetical, DevOps before ML
    ]);
  });

  it("returns grad-year distribution ascending, nulls ignored", () => {
    const h = collegeBatchHealth([
      s({ graduationYear: 2027 }), s({ graduationYear: 2026 }),
      s({ graduationYear: 2027 }), s({ graduationYear: null }),
    ]);
    expect(h.gradYears).toEqual([
      { year: 2026, count: 1 },
      { year: 2027, count: 2 },
    ]);
  });
});
