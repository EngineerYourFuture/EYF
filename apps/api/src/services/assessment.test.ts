import { describe, it, expect } from "vitest";
import { scoreAssessment } from "./assessment.js";
import { ASSESSMENT_BANK } from "../lib/assessment-bank.js";

describe("assessment scorer", () => {
  it("perfect answers yield 100% in each area", () => {
    const answers = ASSESSMENT_BANK.map((q) => ({
      questionId: q.id,
      choice: q.correctIndex,
    }));
    const result = scoreAssessment(answers);
    expect(result.gapAnalysis.dsa).toBe(100);
    expect(result.gapAnalysis.cs).toBe(100);
    expect(result.gapAnalysis.aptitude).toBe(100);
    expect(result.correctAnswers).toBe(ASSESSMENT_BANK.length);
  });

  it("all-wrong answers yield 0% in each area", () => {
    const answers = ASSESSMENT_BANK.map((q) => ({
      questionId: q.id,
      choice: (q.correctIndex + 1) % q.choices.length,
    }));
    const result = scoreAssessment(answers);
    expect(result.gapAnalysis.dsa).toBe(0);
    expect(result.gapAnalysis.cs).toBe(0);
    expect(result.gapAnalysis.aptitude).toBe(0);
    expect(result.correctAnswers).toBe(0);
  });

  it("placement probability for dream tier is monotonic in readiness", () => {
    const empty = scoreAssessment([]);
    const perfect = scoreAssessment(
      ASSESSMENT_BANK.map((q) => ({ questionId: q.id, choice: q.correctIndex })),
    );
    expect(perfect.placementProbability.dream.prob).toBeGreaterThan(
      empty.placementProbability.dream.prob,
    );
  });

  it("realistic tier always has higher probability than dream tier", () => {
    const partial = scoreAssessment(
      ASSESSMENT_BANK.slice(0, 10).map((q) => ({ questionId: q.id, choice: q.correctIndex })),
    );
    expect(partial.placementProbability.realistic.prob)
      .toBeGreaterThanOrEqual(partial.placementProbability.dream.prob);
  });

  it("ignores unknown question IDs", () => {
    const result = scoreAssessment([{ questionId: "fake-question-id", choice: 0 }]);
    expect(result.correctAnswers).toBe(0);
    expect(result.totalQuestions).toBe(1);
  });
});
