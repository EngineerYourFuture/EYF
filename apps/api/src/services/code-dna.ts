/**
 * Code DNA — fingerprints a user's coding profile from their submission history.
 * Phase 4 Week 25–26 per spec. Returns a stable JSON shape consumed by the
 * dashboard card and the AI Career Strategist.
 */
import { prisma, Verdict, type Language, type Difficulty } from "@eyf/db";

export type CodeDna = {
  totalSubmissions: number;
  acceptedCount: number;
  acceptanceRate: number;
  primaryLanguage: Language | null;
  languageMix: { language: Language; count: number; pct: number }[];
  difficultyMix: { difficulty: Difficulty; count: number; pct: number }[];
  patternStrengths: { pattern: string; acceptanceRate: number; attempts: number }[];
  patternWeaknesses: { pattern: string; acceptanceRate: number; attempts: number }[];
  avgRuntimeMs: number | null;
  fastestSolveMin: number | null;
  firstTryRate: number;          // solved on the first submission / solved problems
  avgAttemptsToSolve: number;    // submissions up to & incl. the first AC, per solved problem
  speedAccuracy: string;         // one-line read on the tradeoff
  habitFlags: string[];
};

export async function computeCodeDna(userId: string): Promise<CodeDna> {
  const submissions = await prisma.problemSolution.findMany({
    where: { userId },
    select: {
      problemId: true, verdict: true, language: true, runtimeMs: true, submittedAt: true,
      problem: { select: { difficulty: true, patterns: true } },
    },
    orderBy: { submittedAt: "asc" },
  });

  const total = submissions.length;
  const accepted = submissions.filter((s) => s.verdict === Verdict.ACCEPTED);

  // Language mix.
  const langCounts = new Map<Language, number>();
  for (const s of submissions) langCounts.set(s.language, (langCounts.get(s.language) ?? 0) + 1);
  const languageMix = Array.from(langCounts.entries())
    .map(([language, count]) => ({ language, count, pct: total ? count / total : 0 }))
    .sort((a, b) => b.count - a.count);

  // Difficulty mix (over accepted).
  const diffCounts = new Map<Difficulty, number>();
  for (const s of accepted) diffCounts.set(s.problem.difficulty, (diffCounts.get(s.problem.difficulty) ?? 0) + 1);
  const difficultyMix = Array.from(diffCounts.entries())
    .map(([difficulty, count]) => ({ difficulty, count, pct: accepted.length ? count / accepted.length : 0 }));

  // Pattern strengths/weaknesses — per-pattern acceptance rate.
  const patternStats = new Map<string, { attempts: number; accepted: number }>();
  for (const s of submissions) {
    for (const p of s.problem.patterns) {
      const cur = patternStats.get(p) ?? { attempts: 0, accepted: 0 };
      cur.attempts += 1;
      if (s.verdict === Verdict.ACCEPTED) cur.accepted += 1;
      patternStats.set(p, cur);
    }
  }
  const patternRows = Array.from(patternStats.entries())
    .filter(([, v]) => v.attempts >= 2) // ignore one-offs
    .map(([pattern, v]) => ({ pattern, attempts: v.attempts, acceptanceRate: v.accepted / v.attempts }));
  const patternStrengths = [...patternRows].sort((a, b) => b.acceptanceRate - a.acceptanceRate).slice(0, 5);
  const patternWeaknesses = [...patternRows].sort((a, b) => a.acceptanceRate - b.acceptanceRate).slice(0, 5);

  const runtimes = accepted.map((s) => s.runtimeMs).filter((r): r is number => r != null);
  const avgRuntimeMs = runtimes.length ? Math.round(runtimes.reduce((a, b) => a + b, 0) / runtimes.length) : null;

  // Time-to-first-AC per problem (approximated from same-problem grouping).
  // For now: fastest single accepted runtime is the closest signal.
  const fastestSolveMin = runtimes.length ? Math.round(Math.min(...runtimes) / 60_000 * 10) / 10 : null;

  // Speed vs accuracy — per-problem, how many submissions until the first AC.
  const byProblem = new Map<string, Verdict[]>();
  for (const s of submissions) {
    const arr = byProblem.get(s.problemId) ?? [];
    arr.push(s.verdict);
    byProblem.set(s.problemId, arr);
  }
  let solvedProblems = 0, firstTryACs = 0, attemptsSum = 0;
  for (const verdicts of byProblem.values()) {
    const firstAc = verdicts.indexOf(Verdict.ACCEPTED);
    if (firstAc === -1) continue;
    solvedProblems += 1;
    attemptsSum += firstAc + 1;
    if (firstAc === 0) firstTryACs += 1;
  }
  const firstTryRate = solvedProblems ? firstTryACs / solvedProblems : 0;
  const avgAttemptsToSolve = solvedProblems ? Math.round((attemptsSum / solvedProblems) * 10) / 10 : 0;
  const speedAccuracy =
    solvedProblems < 3 ? "Solve a few more to read your style."
    : avgAttemptsToSolve <= 1.4 ? "One-shot solver — you commit correct code first try."
    : firstTryRate < 0.35 && avgAttemptsToSolve >= 2.4 ? "Fast but buggy — you rush the first submit. Dry-run on paper before running."
    : avgAttemptsToSolve <= 2.2 ? "Iterates to correct — a couple of tries, then lands it."
    : "Brute-forces via retries — slow down and trace edge cases before submitting.";

  const habitFlags: string[] = [];
  if (total >= 50 && accepted.length / total < 0.4) habitFlags.push("low-acceptance-grinder");
  if (total >= 20 && languageMix[0] && languageMix[0].pct > 0.85) habitFlags.push("monolingual");
  if (diffCounts.get("HARD") && diffCounts.get("HARD")! >= 5) habitFlags.push("hard-leaner");
  if (accepted.length >= 30 && (diffCounts.get("EASY") ?? 0) / accepted.length > 0.7) habitFlags.push("easy-mode");

  return {
    totalSubmissions: total,
    acceptedCount: accepted.length,
    acceptanceRate: total ? accepted.length / total : 0,
    primaryLanguage: languageMix[0]?.language ?? null,
    languageMix,
    difficultyMix,
    patternStrengths,
    patternWeaknesses,
    avgRuntimeMs,
    fastestSolveMin,
    firstTryRate,
    avgAttemptsToSolve,
    speedAccuracy,
    habitFlags,
  };
}
