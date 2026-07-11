/**
 * AI Course Builder service (PRD §20). House rule: a deterministic skeleton
 * ALWAYS produces a usable, editable course; the LLM enriches it when a key is
 * present. Either way an instructor reviews and edits before publishing —
 * AI drafts, humans commit. Attacks the trainer-bottleneck pain (P6).
 */
import { generateCourseOutline } from "../services/anthropic.js";

export type OutlineBlock = { type: string; data: Record<string, string> };
export type OutlineLesson = { title: string; skillSlug: string; blocks: OutlineBlock[] };
export type Outline = { title: string; description: string; lessons: OutlineLesson[]; source: "ai" | "template" };

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "topic";

/** Deterministic skeleton — a real, teachable structure, not a placeholder.
 *  Intro → N concept lessons → a hands-on lesson → recap, all skill-tagged. */
function templateOutline(topic: string, audience: string, lessonCount: number): Outline {
  const base = slug(topic);
  const n = Math.max(3, Math.min(8, lessonCount));
  const concepts = Math.max(1, n - 3);
  const lessons: OutlineLesson[] = [];

  lessons.push({
    title: `Introduction to ${topic}`,
    skillSlug: base,
    blocks: [
      { type: "heading", data: { text: `Why ${topic} matters` } },
      { type: "rich_text", data: { text: `This course takes a ${audience} engineer from the fundamentals of ${topic} to hands-on competence. By the end you'll be able to reason about it in interviews and apply it on the job.` } },
      { type: "callout", data: { text: `Interviewers probe ${topic} to separate people who memorised from people who understand — aim for the "why", not just the "how".` } },
    ],
  });
  for (let i = 1; i <= concepts; i++) {
    lessons.push({
      title: `${topic} — core concept ${i}`,
      skillSlug: base,
      blocks: [
        { type: "heading", data: { text: `Core concept ${i}` } },
        { type: "rich_text", data: { text: `Explain the ${i}${i === 1 ? "st" : i === 2 ? "nd" : i === 3 ? "rd" : "th"} building block of ${topic} here. Replace this with the real teaching content — the structure is ready.` } },
        { type: "code", data: { code: `// ${topic}: worked example ${i}\n// replace with a real snippet` } },
      ],
    });
  }
  lessons.push({
    title: `${topic} — hands-on`,
    skillSlug: base,
    blocks: [
      { type: "heading", data: { text: "Apply it" } },
      { type: "rich_text", data: { text: `Now practice. Solve the exercise below, then explain your approach out loud.` } },
      { type: "judged_code", data: { problemSlug: `${base}-practice` } },
    ],
  });
  lessons.push({
    title: `${topic} — recap & next steps`,
    skillSlug: base,
    blocks: [
      { type: "heading", data: { text: "What you learned" } },
      { type: "rich_text", data: { text: `Recap the key ideas of ${topic} and point to where to go deeper.` } },
    ],
  });

  return {
    title: `${topic} — ${audience} track`,
    description: `An onboarding-ready ${topic} course for ${audience} engineers. Generated skeleton — edit each lesson, then publish.`,
    lessons: lessons.slice(0, n),
    source: "template",
  };
}

export async function buildCourseOutline(input: { topic: string; audience: string; lessonCount: number }): Promise<Outline> {
  try {
    const ai = await generateCourseOutline(input);
    if (ai.lessons?.length) {
      return {
        title: ai.title,
        description: ai.description,
        lessons: ai.lessons.map((l) => ({ title: l.title, skillSlug: slug(l.skillSlug || input.topic), blocks: (l.blocks ?? []).map((b) => ({ type: b.type, data: b.data ?? {} })) })),
        source: "ai",
      };
    }
  } catch {
    /* no key / bad JSON → deterministic skeleton below */
  }
  return templateOutline(input.topic, input.audience, input.lessonCount);
}
