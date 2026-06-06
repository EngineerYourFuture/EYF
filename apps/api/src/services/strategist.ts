/**
 * AI Career Strategist — generates a monthly playbook for the student based
 * on their Code DNA, target track, and recent activity. Spec §27.
 */
import { prisma } from "@eyf/db";
import { anthropic } from "./anthropic.js";
import { computeCodeDna, type CodeDna } from "./code-dna.js";

const MODEL = "claude-sonnet-4-6";

export type StrategyPlan = {
  generatedAt: string;
  summary: string;
  nextFourWeeks: { week: number; focus: string; actions: string[] }[];
  redFlags: string[];
  greenFlags: string[];
  targetCompanies: string[];
};

export async function generateStrategy(userId: string): Promise<StrategyPlan> {
  if (!anthropic) throw new Error("ANTHROPIC_API_KEY not set");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      tracks: { where: { isPrimary: true }, include: { track: true } },
      assessments: { orderBy: { completedAt: "desc" }, take: 1 },
    },
  });
  if (!user) throw new Error("user not found");
  const dna = await computeCodeDna(userId);
  const primary = user.tracks[0]?.track;

  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system:
      "You are an honest placement strategist for Indian engineering students. Read the student's stats and produce a focused next-4-weeks plan. Respond ONLY as JSON in the shape: { \"summary\": string, \"nextFourWeeks\": [{ \"week\": number, \"focus\": string, \"actions\": string[] }], \"redFlags\": string[], \"greenFlags\": string[], \"targetCompanies\": string[] }. Be concrete. No generic advice.",
    messages: [
      {
        role: "user",
        content: buildStrategyPrompt({
          name: user.name,
          college: user.college,
          gradYear: user.graduationYear,
          trackName: primary?.name,
          trackCompanies: primary?.companies,
          dna,
          latestGap: user.assessments[0]?.gapAnalysis as { dsa?: number; cs?: number; aptitude?: number } | undefined,
        }),
      },
    ],
  });
  const text = msg.content.find((c) => c.type === "text")?.text ?? "";
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  const parsed = JSON.parse(text.slice(start, end + 1)) as Omit<StrategyPlan, "generatedAt">;
  return { ...parsed, generatedAt: new Date().toISOString() };
}

function buildStrategyPrompt(input: {
  name: string;
  college: string | null;
  gradYear: number | null;
  trackName: string | undefined;
  trackCompanies: string[] | undefined;
  dna: CodeDna;
  latestGap?: { dsa?: number; cs?: number; aptitude?: number };
}): string {
  return [
    `Student: ${input.name}`,
    input.college ? `College: ${input.college}` : null,
    input.gradYear ? `Graduation: ${input.gradYear}` : null,
    input.trackName ? `Target role: ${input.trackName}` : "Target role: not set",
    input.trackCompanies?.length ? `Target companies: ${input.trackCompanies.join(", ")}` : null,
    "",
    `Code DNA:`,
    `  Submissions: ${input.dna.totalSubmissions} (${input.dna.acceptedCount} accepted, ${Math.round(input.dna.acceptanceRate * 100)}%)`,
    `  Primary language: ${input.dna.primaryLanguage ?? "—"}`,
    `  Difficulty mix: ${input.dna.difficultyMix.map((d) => `${d.difficulty}=${d.count}`).join(", ")}`,
    `  Strong patterns: ${input.dna.patternStrengths.slice(0, 3).map((p) => `${p.pattern} (${Math.round(p.acceptanceRate * 100)}%)`).join(", ")}`,
    `  Weak patterns: ${input.dna.patternWeaknesses.slice(0, 3).map((p) => `${p.pattern} (${Math.round(p.acceptanceRate * 100)}%)`).join(", ")}`,
    `  Habits: ${input.dna.habitFlags.join(", ") || "none flagged"}`,
    "",
    input.latestGap ? `Last assessment gaps: DSA=${input.latestGap.dsa}%, CS=${input.latestGap.cs}%, Apt=${input.latestGap.aptitude}%` : "No assessment taken yet.",
  ].filter(Boolean).join("\n");
}
