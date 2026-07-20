/**
 * Parent progress digest (Innovation Roadmap B3). Composes a warm, honest weekly
 * summary for a student's parent — the payer and the anxious party in the Indian
 * market. Drives conversion (the payer sees value) and retention (the student
 * feels supported).
 *
 * Integrity rule: NEVER promise or imply a guaranteed placement. India's market
 * is full of "guaranteed placement" coaching scams; the digest reassures with
 * effort and consistency, never with an outcome promise. Every `note` string is
 * written to that rule.
 */
export type ParentDigestInput = {
  studentName: string;
  streakDays: number;
  level: number;
  totalSolved: number;
  solvedThisWeek: number;
  /** e.g. "Getting interview-ready"; null when not yet computed. */
  readinessBand: string | null;
};

export type ParentDigest = {
  firstName: string;
  headline: string;
  metrics: { label: string; value: string }[];
  note: string;
};

type Tone = "strong" | "progress" | "quiet";

function toneOf(input: ParentDigestInput): Tone {
  if (input.solvedThisWeek > 0 && input.streakDays >= 7) return "strong";
  if (input.solvedThisWeek > 0) return "progress";
  return "quiet";
}

const HEADLINE: Record<Tone, (name: string) => string> = {
  strong: (n) => `${n} had a strong, consistent week.`,
  progress: (n) => `${n} kept making progress this week.`,
  quiet: (n) => `${n} had a quieter week — every journey has them.`,
};

// Honest reassurance, never an outcome promise.
const NOTE: Record<Tone, string> = {
  strong: "Consistency like this is exactly the habit placement-ready students build. They're putting in the work.",
  progress: "Steady effort adds up week over week. They're on a good track — keep encouraging them.",
  quiet: "A slow week is completely normal. What matters is they're set up to bounce back, and a word of encouragement from you goes a long way.",
};

export function buildParentDigest(input: ParentDigestInput): ParentDigest {
  const firstName = input.studentName.trim().split(/\s+/)[0] || input.studentName.trim() || "Your child";
  const tone = toneOf(input);
  return {
    firstName,
    headline: HEADLINE[tone](firstName),
    metrics: [
      { label: "Current streak", value: `${input.streakDays} day${input.streakDays === 1 ? "" : "s"}` },
      { label: "Solved this week", value: String(input.solvedThisWeek) },
      { label: "Total solved", value: String(input.totalSolved) },
      { label: "Level", value: String(input.level) },
      { label: "Placement readiness", value: input.readinessBand ?? "Building up" },
    ],
    note: NOTE[tone],
  };
}

// ─── DB glue ──────────────────────────────────────────────────────
import { prisma, Verdict } from "@eyf/db";

/**
 * Assemble a student's digest from their live stats. v1 ranks on stored profile
 * stats + accepted problems in the last 7 days; the readiness band is left null
 * until a materialized Readiness Index (HARD-6) makes it cheap to include.
 */
export async function parentDigestFor(userId: string): Promise<ParentDigest | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, profile: { select: { level: true, streakDays: true, totalSolved: true } } },
  });
  if (!user) return null;
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const solved = await prisma.problemSolution.findMany({
    where: { userId, verdict: Verdict.ACCEPTED, submittedAt: { gte: weekAgo } },
    distinct: ["problemId"],
    select: { problemId: true },
  });
  return buildParentDigest({
    studentName: user.name,
    streakDays: user.profile?.streakDays ?? 0,
    level: user.profile?.level ?? 1,
    totalSolved: user.profile?.totalSolved ?? 0,
    solvedThisWeek: solved.length,
    readinessBand: null,
  });
}
