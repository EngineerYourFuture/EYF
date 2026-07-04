/**
 * AI mock interview — Anthropic Claude as the interviewer.
 *
 * Turn shape:
 *   [{role: "user" | "assistant", content: string, ts: number}]
 *
 * Phase 1 = text-only. Voice (Whisper) lands Phase 2 Week 11–12 per spec.
 */
import { anthropic } from "./anthropic.js";
import { parseMockFeedback, type MockFeedback } from "../lib/mock-feedback.js";

export type { MockFeedback };

const MODEL = "claude-sonnet-4-6";

export type Turn = { role: "user" | "assistant"; content: string; ts: number };

export type MockKickoff = { greeting: string; focus: string };

export async function startMockSession(input: {
  candidateName: string;
  company?: string;
  problemFocus?: string;
}): Promise<MockKickoff> {
  if (!anthropic) throw new Error("ANTHROPIC_API_KEY not set");
  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 300,
    system: interviewerSystemPrompt(input),
    messages: [{ role: "user", content: "Hi, I'm ready to start." }],
  });
  const greeting = msg.content.find((c) => c.type === "text")?.text ?? "";
  return { greeting, focus: input.problemFocus ?? "general DSA" };
}

export async function nextTurn(input: {
  candidateName: string;
  company?: string;
  problemFocus?: string;
  history: Turn[];
}): Promise<string> {
  if (!anthropic) throw new Error("ANTHROPIC_API_KEY not set");
  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 600,
    system: interviewerSystemPrompt(input),
    messages: input.history.map((t) => ({ role: t.role, content: t.content })),
  });
  return msg.content.find((c) => c.type === "text")?.text ?? "";
}


export async function gradeMockSession(history: Turn[]): Promise<MockFeedback> {
  if (!anthropic) throw new Error("ANTHROPIC_API_KEY not set");
  const transcript = history.map((t) => `${t.role === "user" ? "Candidate" : "Interviewer"}: ${t.content}`).join("\n\n");
  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1200,
    system: gradingSystemPrompt(),
    messages: [{ role: "user", content: `Transcript:\n\n${transcript}` }],
  });
  const text = msg.content.find((c) => c.type === "text")?.text ?? "";
  return parseMockFeedback(text);
}

function interviewerSystemPrompt(input: { candidateName: string; company?: string; problemFocus?: string }) {
  return `You are conducting a realistic technical interview for ${input.candidateName} for a ${input.company ?? "tech"} SDE role.
Focus area: ${input.problemFocus ?? "data structures and algorithms"}.

RULES:
- Ask ONE problem clearly. Wait for the candidate's approach BEFORE letting them code.
- Push back politely if the approach is suboptimal. Ask about edge cases, complexity.
- Don't give the answer. Nudge with Socratic hints.
- Keep each turn under 4 sentences unless asked to clarify.
- After ~6 candidate turns, indicate the interview is wrapping up and ask if they have questions for you.
- Stay in character. Don't break the fourth wall about being an AI unless directly asked.`;
}

function gradingSystemPrompt() {
  return `You are an expert interview coach. Grade the candidate based on the transcript.

Return ONLY valid JSON in this exact shape (no preamble, no markdown fences):
{
  "overallScore": number,                  // 0-100
  "strengths": string[],                   // 2-4 short bullets
  "improvements": string[],                // 2-4 short bullets, actionable
  "rubric": {
    "problemUnderstanding": number,        // 0-100
    "approachClarity": number,
    "codeQuality": number,
    "edgeCases": number,
    "communication": number
  },
  "summary": string                        // 2-3 sentences
}

Be honest. Penalize hand-waving on complexity. Reward structured communication and edge-case discussion.`;
}
