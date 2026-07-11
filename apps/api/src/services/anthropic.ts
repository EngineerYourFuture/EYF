import Anthropic from "@anthropic-ai/sdk";
import { env } from "../env.js";

export const anthropic = env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  : null;

const MODEL_SONNET = "claude-sonnet-4-6";
const MODEL_HAIKU  = "claude-haiku-4-5-20251001";

export async function generateProblemVariant(input: {
  title: string;
  description: string;
}): Promise<{ title: string; description: string; twistExplanation: string }> {
  if (!anthropic) throw new Error("ANTHROPIC_API_KEY not set");
  const msg = await anthropic.messages.create({
    model: MODEL_SONNET,
    max_tokens: 1024,
    system:
      "You are a DSA problem author. Generate a single VARIANT of the given problem that uses the same core technique but changes the surface — different domain, slightly altered constraints, or an extra twist. Respond ONLY as JSON: { \"title\": string, \"description\": string, \"twistExplanation\": string }.",
    messages: [
      { role: "user", content: `Original problem:\n\n# ${input.title}\n\n${input.description}` },
    ],
  });
  const text = msg.content.find((c) => c.type === "text")?.text ?? "";
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return JSON.parse(text.slice(start, end + 1));
}

/**
 * One-line personal coaching note for the guidance engine. Haiku (cheap/fast).
 * The CALLER owns caching + the deterministic fallback — this throws if no key,
 * exactly like the other functions here, so guidance.ts can catch and fall back
 * to the deterministic action reason. Never blocks scoring.
 */
export async function generateCoachNote(input: {
  band: string;
  overall: number;
  topAction: string;
  topReason: string;
  weakPillars: string; // e.g. "Problem Solving 40, Aptitude 20"
}): Promise<string> {
  if (!anthropic) throw new Error("ANTHROPIC_API_KEY not set");
  const msg = await anthropic.messages.create({
    model: MODEL_HAIKU,
    max_tokens: 120,
    system:
      "You are a placement-prep coach for an Indian engineering student. Given their readiness snapshot, write ONE punchy, specific, encouraging sentence (max 30 words) telling them exactly what to do today and why it moves the needle. No preamble, no markdown, no emojis. Second person.",
    messages: [
      {
        role: "user",
        content: `Readiness ${input.overall}/100 (${input.band}). Weak pillars: ${input.weakPillars}. Next best action: ${input.topAction} — ${input.topReason}`,
      },
    ],
  });
  return msg.content.find((c) => c.type === "text")?.text?.trim() ?? "";
}

export async function generateHint(input: {
  problemTitle: string;
  problemDescription: string;
  studentCode: string;
  language: string;
}): Promise<string> {
  if (!anthropic) throw new Error("ANTHROPIC_API_KEY not set");
  const msg = await anthropic.messages.create({
    model: MODEL_HAIKU,
    max_tokens: 400,
    system:
      "You are a Socratic DSA tutor. Give ONE small hint that nudges the student toward the right approach. Never give the full solution. Never write code longer than 3 lines. Match the student's language.",
    messages: [
      {
        role: "user",
        content: `Problem: ${input.problemTitle}\n${input.problemDescription}\n\nMy ${input.language} attempt:\n\`\`\`\n${input.studentCode}\n\`\`\``,
      },
    ],
  });
  return msg.content.find((c) => c.type === "text")?.text ?? "";
}

/**
 * Ask EYF — original tech-stack answer for the knowledge base. The answer is
 * EYF Intelligence's OWN explanation (no third-party docs are ingested or
 * reproduced), written with a placement angle: concept, why interviewers ask
 * it, common follow-ups, one hands-on next step. Plain text (short paragraphs
 * + hyphen bullets) because the web renders answers with pre-wrap, not a
 * markdown parser.
 */
export async function answerTechQuestion(input: { question: string }): Promise<{
  answer: string;
  topic: string;
  tags: string[];
}> {
  if (!anthropic) throw new Error("ANTHROPIC_API_KEY not set");
  const msg = await anthropic.messages.create({
    model: MODEL_SONNET,
    max_tokens: 1400,
    system:
      "You are EYF Intelligence, the tech mentor inside India's placement-prep platform. A student asks a tech-stack / CS question. Write an ORIGINAL, self-contained answer in your own words — never reproduce documentation text. Structure (plain text, NO markdown symbols like # or **; use short paragraphs and lines starting with '- ' for bullets): 1) a crisp explanation of the concept, 2) 'Why interviews ask this' — 2-3 lines, 3) 'Likely follow-up questions' — 2-3 bullets, 4) 'Try this' — one concrete hands-on exercise. Keep it under 350 words, direct, second person. If the question is not a tech/CS/career-prep question, answer briefly and steer back to prep. Respond ONLY as JSON: { \"answer\": string, \"topic\": string (one lowercase word like \"react\", \"node\", \"dbms\", \"system-design\", \"general\"), \"tags\": string[] (2-4 lowercase keywords) }.",
    messages: [{ role: "user", content: input.question }],
  });
  const text = msg.content.find((c) => c.type === "text")?.text ?? "";
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as { answer?: string; topic?: string; tags?: string[] };
    if (!parsed.answer) throw new Error("empty answer");
    return {
      answer: parsed.answer,
      topic: (parsed.topic || "general").toLowerCase().slice(0, 40),
      tags: (parsed.tags ?? []).slice(0, 4).map((t) => t.toLowerCase().slice(0, 30)),
    };
  } catch {
    // Model didn't return clean JSON — the raw text is still a valid answer.
    return { answer: text.trim(), topic: "general", tags: [] };
  }
}

/**
 * AI Course Builder (PRD §20) — draft a course outline from a topic. Returns
 * lessons with block outlines the instructor then edits. LLM path only; the
 * CALLER (lib/ai-course.ts) owns the deterministic fallback so this feature
 * works with no Anthropic key. Plain-text block data (no markdown) — the
 * builder/player render pre-wrap.
 */
export async function generateCourseOutline(input: {
  topic: string;
  audience: string;
  lessonCount: number;
}): Promise<{ title: string; description: string; lessons: { title: string; skillSlug: string; blocks: { type: string; data: Record<string, string> }[] }[] }> {
  if (!anthropic) throw new Error("ANTHROPIC_API_KEY not set");
  const msg = await anthropic.messages.create({
    model: MODEL_SONNET,
    max_tokens: 2400,
    system:
      "You are an instructional designer building an engineering onboarding/training course. Given a topic and audience, produce a course of the requested lesson count. Each lesson has 3-5 blocks. Block types: heading (data.text), rich_text (data.text, 2-4 sentences, plain text no markdown), callout (data.text, one interview/practical tip), code (data.code, a short real snippet), judged_code (data.problemSlug, a plausible kebab-case exercise slug). Every lesson names ONE skillSlug it teaches (lowercase-hyphen). Respond ONLY as JSON: { \"title\": string, \"description\": string, \"lessons\": [{ \"title\": string, \"skillSlug\": string, \"blocks\": [{ \"type\": string, \"data\": object }] }] }.",
    messages: [{ role: "user", content: `Topic: ${input.topic}\nAudience: ${input.audience}\nLessons: ${input.lessonCount}` }],
  });
  const text = msg.content.find((c) => c.type === "text")?.text ?? "";
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return JSON.parse(text.slice(start, end + 1));
}
