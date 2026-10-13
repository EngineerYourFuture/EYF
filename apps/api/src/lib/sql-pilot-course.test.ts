import { describe, expect, it } from "vitest";
import { SQL_PILOT_LESSONS } from "./sql-pilot-course.js";
import { lessonBlocksInput } from "./lms.js";
import { SQL_LABS } from "../services/practical-labs.js";

describe("SQL pilot curriculum", () => {
  it("contains valid lessons, graded checks, and both versioned practical labs", () => {
    for (const lesson of SQL_PILOT_LESSONS) {
      expect(lessonBlocksInput.safeParse(lesson.blocks).success).toBe(true);
      expect(lesson.blocks.some((block) => block.type === "quiz")).toBe(true);
    }
    const slugs = SQL_PILOT_LESSONS.flatMap((lesson) => lesson.blocks.filter((b) => b.type === "judged_code").map((b) => b.data.problemSlug));
    expect(slugs).toEqual(SQL_LABS.map((lab) => lab.slug));
    for (const lab of SQL_LABS) expect(lab.tests.filter((t) => !t.isPublic).length).toBeGreaterThanOrEqual(5);
  });
});
