/**
 * EYF Wrapped — year in review (spec Phase 4 Week 32–34).
 * Pure stats; the share-card and Claude-narrated headline come on top.
 */
import { prisma, Verdict, type Difficulty } from "@eyf/db";

export type WrappedYear = {
  year: number;
  totalSolved: number;
  bestStreakDays: number;
  byDifficulty: Record<string, number>;
  topPattern: string | null;
  primaryLanguage: string | null;
  totalSubmissions: number;
  longestSession: { date: string; problemsSolved: number } | null;
  badgesEarned: number;
  mockSessions: number;
  headline: string;
};

export async function buildWrapped(userId: string, year: number): Promise<WrappedYear> {
  const start = new Date(Date.UTC(year, 0, 1));
  const end   = new Date(Date.UTC(year + 1, 0, 1));

  const [solutions, streaks, badges, mocks, profile] = await Promise.all([
    prisma.problemSolution.findMany({
      where: { userId, submittedAt: { gte: start, lt: end } },
      select: { verdict: true, language: true, problem: { select: { difficulty: true, patterns: true } } },
    }),
    prisma.dailyStreak.findMany({
      where: { userId, date: { gte: start, lt: end } },
      orderBy: { problemsSolved: "desc" },
    }),
    prisma.userBadge.count({
      where: { userId, earnedAt: { gte: start, lt: end } },
    }),
    prisma.mockSession.count({
      where: { candidateId: userId, createdAt: { gte: start, lt: end } },
    }),
    prisma.userProfile.findUnique({
      where: { userId },
      select: { longestStreak: true, currentXp: true },
    }),
  ]);

  const accepted = solutions.filter((s) => s.verdict === Verdict.ACCEPTED);
  const byDifficulty: Record<string, number> = {};
  const patternCounts = new Map<string, number>();
  const langCounts = new Map<string, number>();
  for (const s of accepted) {
    const d = s.problem.difficulty as Difficulty;
    byDifficulty[d] = (byDifficulty[d] ?? 0) + 1;
    for (const p of s.problem.patterns) patternCounts.set(p, (patternCounts.get(p) ?? 0) + 1);
    langCounts.set(s.language, (langCounts.get(s.language) ?? 0) + 1);
  }
  const topPattern = [...patternCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const primaryLanguage = [...langCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const longestSession = streaks[0]
    ? { date: streaks[0].date.toISOString().slice(0, 10), problemsSolved: streaks[0].problemsSolved }
    : null;

  return {
    year,
    totalSolved: accepted.length,
    bestStreakDays: profile?.longestStreak ?? 0,
    byDifficulty,
    topPattern,
    primaryLanguage,
    totalSubmissions: solutions.length,
    longestSession,
    badgesEarned: badges,
    mockSessions: mocks,
    headline: buildHeadline({
      totalSolved: accepted.length,
      topPattern,
      bestStreakDays: profile?.longestStreak ?? 0,
    }),
  };
}

function buildHeadline(input: { totalSolved: number; topPattern: string | null; bestStreakDays: number }): string {
  if (input.totalSolved === 0) return "A quiet year. Next one's yours.";
  if (input.totalSolved < 50) return `Got the engine started — ${input.totalSolved} problems down.`;
  if (input.bestStreakDays >= 30) return `${input.bestStreakDays}-day streak. ${input.totalSolved} solved. Relentless.`;
  if (input.topPattern) return `${input.totalSolved} solved. You quietly mastered ${input.topPattern}.`;
  return `${input.totalSolved} problems. That's not luck — that's work.`;
}
