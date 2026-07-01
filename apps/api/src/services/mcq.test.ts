import { describe, it, expect } from "vitest";
import { scoreMcq } from "./mcq.js";
import { MCQ_BANK, MCQ_CATEGORIES, mcqCount, pickTest, getMcq } from "../lib/mcq-bank.js";

describe("mcq bank integrity", () => {
  it("every question has a valid correctIndex and non-empty explanation", () => {
    for (const q of MCQ_BANK) {
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(q.choices.length);
      expect(q.choices.length).toBeGreaterThanOrEqual(2);
      expect(q.explanation.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate ids", () => {
    const ids = MCQ_BANK.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("category counts match the bank", () => {
    for (const c of MCQ_CATEGORIES) {
      expect(mcqCount(c.id)).toBe(MCQ_BANK.filter((q) => q.category === c.id).length);
    }
  });
});

describe("pickTest", () => {
  it("returns the requested count within a category", () => {
    const test = pickTest({ category: "APTITUDE", count: 5 });
    expect(test).toHaveLength(5);
    expect(test.every((q) => q.category === "APTITUDE")).toBe(true);
  });

  it("falls back to the full category pool when a company filter is too narrow", () => {
    // A count larger than any single company's tagged set forces the fallback.
    const test = pickTest({ category: "APTITUDE", company: "Goldman Sachs", count: 15 });
    expect(test.length).toBeGreaterThan(0);
    expect(test.every((q) => q.category === "APTITUDE")).toBe(true);
  });
});

describe("mcq scorer", () => {
  it("perfect answers score 100", () => {
    const qs = pickTest({ category: "TECHNICAL", count: 10 });
    const result = scoreMcq(qs.map((q) => ({ questionId: q.id, choice: q.correctIndex })));
    expect(result.score).toBe(100);
    expect(result.correctAnswers).toBe(qs.length);
  });

  it("all-wrong (and skipped) answers score 0", () => {
    const qs = pickTest({ category: "VERBAL", count: 10 });
    const result = scoreMcq(qs.map((q) => ({ questionId: q.id, choice: -1 })));
    expect(result.score).toBe(0);
    expect(result.correctAnswers).toBe(0);
  });

  it("builds a per-topic breakdown and review payload", () => {
    const q = getMcq("apt-1")!;
    const result = scoreMcq([{ questionId: q.id, choice: q.correctIndex }]);
    expect(result.byTopic[q.topic]).toEqual({ right: 1, total: 1 });
    expect(result.review[0]).toMatchObject({ questionId: q.id, isCorrect: true, correctIndex: q.correctIndex });
  });

  it("ignores unknown question ids", () => {
    const result = scoreMcq([{ questionId: "does-not-exist", choice: 0 }]);
    expect(result.totalQuestions).toBe(0);
  });
});
