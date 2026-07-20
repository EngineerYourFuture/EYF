import { describe, it, expect } from "vitest";
import { templateOutline, buildCourseOutline } from "./ai-course.js";

describe("templateOutline", () => {
  it("builds intro → N concepts → hands-on → recap, all skill-tagged", () => {
    const o = templateOutline("Distributed Systems", "backend", 6);
    expect(o.source).toBe("template");
    expect(o.lessons).toHaveLength(6);
    expect(o.lessons[0]!.title).toContain("Introduction");
    expect(o.lessons.at(-1)!.title).toContain("recap");
    expect(o.lessons.every((l) => l.skillSlug.length > 0)).toBe(true);
  });

  it("clamps the lesson count to the 3..8 range", () => {
    expect(templateOutline("X", "student", 1).lessons).toHaveLength(3);
    expect(templateOutline("X", "student", 99).lessons).toHaveLength(8);
  });

  it("derives a slug from the topic and uses ordinal suffixes", () => {
    const o = templateOutline("Graph Theory 101!", "student", 5);
    expect(o.lessons.every((l) => /^[a-z0-9-]+$/.test(l.skillSlug))).toBe(true);
    // concept lessons mention '1st', '2nd', '3rd', 'th'
    const richText = o.lessons.flatMap((l) => l.blocks).map((b) => b.data.text ?? "").join(" ");
    expect(richText).toMatch(/1st|2nd|3rd/);
  });
});

describe("buildCourseOutline", () => {
  it("falls back to the deterministic skeleton when the LLM is unavailable", async () => {
    const o = await buildCourseOutline({ topic: "Caching Strategies", audience: "backend", lessonCount: 5 });
    expect(o.lessons).toHaveLength(5);
    expect(["ai", "template"]).toContain(o.source);
    expect(o.title).toContain("Caching");
  });
});
