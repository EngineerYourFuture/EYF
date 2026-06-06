import { ASSESSMENT_BANK, type AssessmentQuestion } from "../lib/assessment-bank.js";

export type GapAnalysis = {
  dsa: number;
  cs: number;
  aptitude: number;
  byTopic: Record<string, number>;
};

export type PlacementProbability = {
  realistic: { company: string; prob: number };
  stretch:   { company: string; prob: number };
  dream:     { company: string; prob: number };
};

/**
 * Score a set of answers against the bank. Returns 0–100 gap scores per area
 * (100 = mastered, 0 = needs work) and a calibrated placement probability for
 * three company tiers.
 */
export function scoreAssessment(answers: { questionId: string; choice: number }[]): {
  totalQuestions: number;
  correctAnswers: number;
  gapAnalysis: GapAnalysis;
  placementProbability: PlacementProbability;
} {
  const byId = new Map(ASSESSMENT_BANK.map((q) => [q.id, q]));
  const counters = {
    dsa:      { right: 0, total: 0 },
    cs:       { right: 0, total: 0 },
    aptitude: { right: 0, total: 0 },
  };
  const byTopic: Record<string, { right: number; total: number }> = {};
  let correct = 0;

  for (const a of answers) {
    const q = byId.get(a.questionId);
    if (!q) continue;
    counters[q.area].total += 1;
    byTopic[q.topic] ??= { right: 0, total: 0 };
    byTopic[q.topic]!.total += 1;
    if (a.choice === q.correctIndex) {
      counters[q.area].right += 1;
      byTopic[q.topic]!.right += 1;
      correct += 1;
    }
  }

  const pct = (c: { right: number; total: number }) =>
    c.total === 0 ? 0 : Math.round((c.right / c.total) * 100);

  const gap: GapAnalysis = {
    dsa: pct(counters.dsa),
    cs: pct(counters.cs),
    aptitude: pct(counters.aptitude),
    byTopic: Object.fromEntries(
      Object.entries(byTopic).map(([t, c]) => [t, pct(c)]),
    ),
  };

  // Composite readiness 0..1, weighted: 60% DSA, 25% CS, 15% aptitude.
  const readiness = (gap.dsa * 0.6 + gap.cs * 0.25 + gap.aptitude * 0.15) / 100;

  // Tier targets — readiness midpoints calibrated for India hiring.
  // Realistic = TCS/Infosys ~0.45, Stretch = Flipkart/Walmart ~0.65, Dream = FAANG ~0.85.
  const sigmoid = (x: number, mid: number, k: number) =>
    1 / (1 + Math.exp(-k * (x - mid)));

  const placementProbability: PlacementProbability = {
    realistic: { company: "TCS / Infosys",       prob: round(sigmoid(readiness, 0.45, 12)) },
    stretch:   { company: "Flipkart / Walmart",  prob: round(sigmoid(readiness, 0.65, 14)) },
    dream:     { company: "Amazon / Google",     prob: round(sigmoid(readiness, 0.85, 16)) },
  };

  return {
    totalQuestions: answers.length,
    correctAnswers: correct,
    gapAnalysis: gap,
    placementProbability,
  };
}

function round(x: number) { return Math.round(x * 100) / 100; }

export { ASSESSMENT_BANK };
export type { AssessmentQuestion };
