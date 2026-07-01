/**
 * Communication coach — Claude grades a spoken/typed answer against the
 * prompt's rubric (see communication-bank.ts). Returns structured, actionable
 * feedback plus a polished model answer. JSON-extraction mirrors
 * gradeMockSession in ai-mock.ts.
 */
import { anthropic } from "./anthropic.js";
import type { CommunicationPrompt } from "../lib/communication-bank.js";

const MODEL = "claude-sonnet-4-6";

export type CommunicationFeedback = {
  overallScore: number; // 0–100
  dimensions: {
    clarity: number;      // easy to follow
    structure: number;    // logical flow / STAR where relevant
    relevance: number;    // actually answered the question
    confidence: number;   // conviction, ownership
    conciseness: number;  // no rambling / filler
  };
  strengths: string[];
  improvements: string[];
  fillerWords: string[];  // filler/hedge words spotted in the answer
  modelAnswer: string;    // a polished example answer for this prompt
};

export async function gradeCommunicationAnswer(input: {
  prompt: CommunicationPrompt;
  transcript: string;
}): Promise<CommunicationFeedback> {
  if (!anthropic) throw new Error("ANTHROPIC_API_KEY not set");
  const { prompt, transcript } = input;

  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1400,
    system: coachSystemPrompt(),
    messages: [{
      role: "user",
      content:
        `INTERVIEW QUESTION (${prompt.kind}): ${prompt.question}\n\n` +
        `A STRONG ANSWER SHOULD COVER:\n${prompt.covers.map((c) => `- ${c}`).join("\n")}\n\n` +
        `CANDIDATE'S ANSWER:\n"""${transcript}"""\n\n` +
        `Grade it and return ONLY the JSON.`,
    }],
  });

  const text = msg.content.find((c) => c.type === "text")?.text ?? "";
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Coach returned non-JSON");
  return JSON.parse(text.slice(start, end + 1)) as CommunicationFeedback;
}

function coachSystemPrompt() {
  return `You are an expert interview communication coach for Indian engineering students preparing for campus placements. You evaluate how someone COMMUNICATES an answer — clarity, structure, confidence, conciseness — not deep technical correctness.

Be encouraging but honest. Penalise rambling, filler words ("um", "like", "actually", "basically", "you know"), vague claims, and answers that dodge the question. Reward structure (STAR for behavioural questions), specific examples, and confident, concise delivery.

Return ONLY valid JSON in this exact shape (no preamble, no markdown fences):
{
  "overallScore": number,          // 0-100, holistic
  "dimensions": {
    "clarity": number,             // 0-100, easy to follow
    "structure": number,           // 0-100, logical flow / STAR where relevant
    "relevance": number,           // 0-100, actually answered the question
    "confidence": number,          // 0-100, conviction and ownership
    "conciseness": number          // 0-100, no rambling / filler
  },
  "strengths": string[],           // 2-4 short, specific bullets
  "improvements": string[],        // 2-4 actionable bullets
  "fillerWords": string[],         // filler/hedge words spotted (empty if none)
  "modelAnswer": string            // a polished 60-120 word example answer for THIS question
}

If the answer is empty or nonsensical, score low and say so in improvements.`;
}
