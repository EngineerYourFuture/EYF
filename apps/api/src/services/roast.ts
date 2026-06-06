/**
 * Get Roasted — Claude reads the user's resume and delivers a harsh,
 * concrete critique. Spec §"Get Roasted" (Phase 4 Week 32–34).
 */
import type { ResumeDocument } from "@eyf/types";
import { anthropic } from "./anthropic.js";

const MODEL = "claude-sonnet-4-6";

export type Roast = {
  oneLiner: string;
  brutal: string[];
  fixable: { issue: string; fix: string }[];
  finalGrade: "F" | "D" | "C" | "B" | "A";
};

export async function roastResume(doc: ResumeDocument): Promise<Roast> {
  if (!anthropic) throw new Error("ANTHROPIC_API_KEY not set");
  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1200,
    system:
      "You are a brutally honest senior engineer reviewing this resume in 30 seconds before tossing it. Be direct, specific, and uncomfortably truthful. No corporate softening, no \"consider\" / \"perhaps\". Indian context. Return ONLY JSON: { \"oneLiner\": string, \"brutal\": string[] (3-5 punches, max 12 words each), \"fixable\": [{\"issue\": string, \"fix\": string}] (3-5 items), \"finalGrade\": \"F\"|\"D\"|\"C\"|\"B\"|\"A\" }.",
    messages: [{ role: "user", content: `Resume JSON:\n\n${JSON.stringify(doc, null, 2)}` }],
  });
  const text = msg.content.find((c) => c.type === "text")?.text ?? "";
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1) throw new Error("Roaster returned non-JSON");
  return JSON.parse(text.slice(start, end + 1)) as Roast;
}
