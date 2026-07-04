import { describe, it, expect } from "vitest";
import { parseMockFeedback } from "./mock-feedback.js";

const valid = JSON.stringify({
  overallScore: 78, strengths: ["clear"], improvements: ["edge cases"],
  rubric: { problemUnderstanding: 80, approachClarity: 75, codeQuality: 70, edgeCases: 60, communication: 82 },
  summary: "solid",
});

describe("parseMockFeedback — hardened grader response parsing", () => {
  it("parses a valid grader response", () => {
    const f = parseMockFeedback(valid);
    expect(f.overallScore).toBe(78);
    expect(f.rubric.communication).toBe(82);
  });
  it("extracts JSON embedded in surrounding prose", () => {
    expect(parseMockFeedback("Here is the grade: " + valid + " — done").overallScore).toBe(78);
  });
  it("throws on non-JSON (no braces)", () => {
    expect(() => parseMockFeedback("the candidate did well")).toThrow(/non-JSON/i);
  });
  it("throws on malformed JSON", () => {
    expect(() => parseMockFeedback('{ "overallScore": 80, ')).toThrow(/malformed|JSON/i);
  });
  it("throws on valid JSON with the WRONG shape (missing rubric — the cast bug)", () => {
    expect(() => parseMockFeedback(JSON.stringify({ overallScore: 80, summary: "x" }))).toThrow();
  });
  it("clamps out-of-range scores to 0..100", () => {
    const f = parseMockFeedback(JSON.stringify({
      overallScore: 150, strengths: [], improvements: [],
      rubric: { problemUnderstanding: -20, approachClarity: 50, codeQuality: 50, edgeCases: 50, communication: 999 },
      summary: "",
    }));
    expect(f.overallScore).toBe(100);
    expect(f.rubric.problemUnderstanding).toBe(0);
    expect(f.rubric.communication).toBe(100);
  });
});
