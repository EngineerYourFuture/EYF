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
