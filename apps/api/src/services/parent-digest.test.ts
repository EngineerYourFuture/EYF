import { describe, it, expect } from "vitest";
import { buildParentDigest, type ParentDigestInput } from "./parent-digest.js";

const base: ParentDigestInput = {
  studentName: "Rahul Sharma", streakDays: 0, level: 3, totalSolved: 40, solvedThisWeek: 0, readinessBand: null,
};

describe("buildParentDigest", () => {
  it("uses the student's first name", () => {
    expect(buildParentDigest(base).firstName).toBe("Rahul");
  });

  it("falls back gracefully when the name is blank", () => {
    expect(buildParentDigest({ ...base, studentName: "   " }).firstName).toBe("Your child");
  });

  it("picks the STRONG tone for an active + consistent week", () => {
    const d = buildParentDigest({ ...base, solvedThisWeek: 12, streakDays: 9 });
    expect(d.headline).toMatch(/strong, consistent/);
    expect(d.note).toMatch(/placement-ready students build/);
  });

  it("picks PROGRESS when active but not on a 7-day streak", () => {
    const d = buildParentDigest({ ...base, solvedThisWeek: 4, streakDays: 3 });
    expect(d.headline).toMatch(/kept making progress/);
  });

  it("picks the gentle QUIET tone for an inactive week (no guilt)", () => {
    const d = buildParentDigest({ ...base, solvedThisWeek: 0, streakDays: 0 });
    expect(d.headline).toMatch(/quieter week/);
    expect(d.note).toMatch(/completely normal/);
  });

  it("NEVER promises or guarantees a placement (India scam-risk guard)", () => {
    for (const [sw, sd] of [[12, 9], [4, 2], [0, 0]] as const) {
      const d = buildParentDigest({ ...base, solvedThisWeek: sw, streakDays: sd });
      const text = `${d.headline} ${d.note}`.toLowerCase();
      expect(text).not.toMatch(/guarantee|guaranteed|assured|will get placed|100%|definitely placed/);
    }
  });

  it("pluralizes the streak and shows the readiness band when present", () => {
    expect(buildParentDigest({ ...base, streakDays: 1 }).metrics.find((m) => m.label === "Current streak")!.value).toBe("1 day");
    expect(buildParentDigest({ ...base, streakDays: 5 }).metrics.find((m) => m.label === "Current streak")!.value).toBe("5 days");
    const band = buildParentDigest({ ...base, readinessBand: "Getting interview-ready" }).metrics.find((m) => m.label === "Placement readiness")!.value;
    expect(band).toBe("Getting interview-ready");
  });
});
