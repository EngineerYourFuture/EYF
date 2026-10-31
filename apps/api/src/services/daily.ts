/**
 * Daily challenge picker — deterministic per user+date so the same problem
 * shows for the whole day. Prefers patterns the user is weak in.
 */
import { prisma, Difficulty, Verdict } from "@eyf/db";

export type DailyChallenge = {
  date: string;
  problem: {
    id: string; slug: string; title: string;
    difficulty: Difficulty; patterns: string[];
  };
  alreadySolvedToday: boolean;
};

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.codePointAt(i)!;
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export async function pickDailyChallenge(userId: string): Promise<DailyChallenge | null> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const dateKey = today.toISOString().slice(0, 10);

  // Weak-pattern bias: find patterns the user has < 50% acceptance on, with ≥2 attempts.
  const submissions = await prisma.problemSolution.findMany({
    where: { userId },
    select: { verdict: true, problem: { select: { patterns: true } } },
  });
  const stats = new Map<string, { att: number; ok: number }>();
  for (const s of submissions) {
    for (const p of s.problem.patterns) {
      const cur = stats.get(p) ?? { att: 0, ok: 0 };
      cur.att += 1;
      if (s.verdict === Verdict.ACCEPTED) cur.ok += 1;
      stats.set(p, cur);
    }
  }
  const weak = Array.from(stats.entries())
    .filter(([, v]) => v.att >= 2 && v.ok / v.att < 0.5)
    .map(([p]) => p);

  const pool = await prisma.problem.findMany({
    where: weak.length > 0
      ? { patterns: { hasSome: weak }, premium: false }
      : { premium: false },
    select: { id: true, slug: true, title: true, difficulty: true, patterns: true },
  });
  if (pool.length === 0) return null;

  const idx = hash(`${userId}-${dateKey}`) % pool.length;
  const problem = pool[idx]!;

  const startOfDay = new Date(today);
  const endOfDay = new Date(today);
  endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);
  const ac = await prisma.problemSolution.findFirst({
    where: {
      userId, problemId: problem.id, verdict: Verdict.ACCEPTED,
      submittedAt: { gte: startOfDay, lt: endOfDay },
    },
    select: { id: true },
  });

  return { date: dateKey, problem, alreadySolvedToday: !!ac };
}
