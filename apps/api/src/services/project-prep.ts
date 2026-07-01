/**
 * Project interview-prep generator. Given a project's title, summary and tech
 * stack, Claude produces the grilling a candidate will face defending it —
 * categorised questions with what each probes and how to approach, plus common
 * red-flags and STAR story hooks. JSON-extraction mirrors ai-mock.ts.
 */
import { anthropic } from "./anthropic.js";

const MODEL = "claude-sonnet-4-6";

export type ProjectQuestion = {
  category: string;   // e.g. "Design decisions", "Scaling", "Debugging", "Trade-offs"
  question: string;
  testing: string;    // what the interviewer is really assessing
  approach: string;   // how to structure a strong answer
};

export type ProjectPrepResult = {
  questions: ProjectQuestion[];
  redFlags: string[];   // things that tank a project discussion
  starHooks: string[];  // STAR story angles this project supports
};

export async function generateProjectPrep(input: {
  title: string;
  summary: string;
  techStack: string[];
}): Promise<ProjectPrepResult> {
  if (!anthropic) throw new Error("ANTHROPIC_API_KEY not set");

  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: prepSystemPrompt(),
    messages: [{
      role: "user",
      content:
        `PROJECT: ${input.title}\n` +
        `SUMMARY: ${input.summary}\n` +
        `TECH STACK: ${input.techStack.join(", ") || "unspecified"}\n\n` +
        `Generate the interview prep guide. Return ONLY the JSON.`,
    }],
  });

  const text = msg.content.find((c) => c.type === "text")?.text ?? "";
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Generator returned non-JSON");
  return JSON.parse(text.slice(start, end + 1)) as ProjectPrepResult;
}

function prepSystemPrompt() {
  return `You are a senior engineer who interviews campus candidates about their projects. Given a student's project, generate the realistic grilling they'll face defending it in a placement interview.

Cover a spread of categories: motivation ("why build this / why this stack"), design decisions, scaling & performance, debugging & the hardest problem, trade-offs & alternatives considered, testing, and "what would you do differently". Tailor questions to the specific tech stack given — reference real concepts (e.g. indexing for a DB, re-renders for React, cold starts for serverless).

Return ONLY valid JSON in this exact shape (no preamble, no markdown fences):
{
  "questions": [
    {
      "category": string,     // short label
      "question": string,     // the actual interview question
      "testing": string,      // 1 sentence: what this really probes
      "approach": string      // 1-2 sentences: how to structure a strong answer
    }
    // 8-12 questions, spread across categories
  ],
  "redFlags": string[],       // 3-5 things that would tank this project discussion
  "starHooks": string[]       // 2-4 STAR behavioural-story angles this project supports
}

Be specific to the project and stack — never generic. Assume an Indian campus placement context (TCS/Infosys/product-company range).`;
}
