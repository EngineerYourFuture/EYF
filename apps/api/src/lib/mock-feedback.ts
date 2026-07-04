import { z } from "zod";

/** Structured AI-mock feedback. Kept here (not ai-mock.ts) so the parser is a
 *  pure module with no Anthropic-SDK side effects — importable in tests. */
export type MockFeedback = {
  overallScore: number;
  strengths: string[];
  improvements: string[];
  rubric: {
    problemUnderstanding: number;
    approachClarity: number;
    codeQuality: number;
    edgeCases: number;
    communication: number;
  };
  summary: string;
};

const schema = z.object({
  overallScore: z.number(),
  strengths: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),
  rubric: z.object({
    problemUnderstanding: z.number(),
    approachClarity: z.number(),
    codeQuality: z.number(),
    edgeCases: z.number(),
    communication: z.number(),
  }),
  summary: z.string().default(""),
});
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/**
 * Parse + validate the LLM grader's response. Hardened against the three real
 * failure modes: non-JSON output, malformed JSON, and valid-JSON-wrong-shape
 * (the previous `as MockFeedback` cast let bad shapes through and broke
 * downstream consumers like the composure trend). Scores are clamped to 0..100.
 */
export function parseMockFeedback(text: string): MockFeedback {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Grader returned non-JSON");
  let raw: unknown;
  try {
    raw = JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new Error("Grader returned malformed JSON");
  }
  const f = schema.parse(raw); // throws on wrong shape
  return {
    overallScore: clamp(f.overallScore),
    strengths: f.strengths,
    improvements: f.improvements,
    summary: f.summary,
    rubric: {
      problemUnderstanding: clamp(f.rubric.problemUnderstanding),
      approachClarity: clamp(f.rubric.approachClarity),
      codeQuality: clamp(f.rubric.codeQuality),
      edgeCases: clamp(f.rubric.edgeCases),
      communication: clamp(f.rubric.communication),
    },
  };
}
