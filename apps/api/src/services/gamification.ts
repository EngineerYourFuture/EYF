import { prisma, Verdict, Difficulty } from "@eyf/db";
import { XP_PER_VERDICT, STREAK_BONUS, levelForXp } from "@eyf/types";

/**
 * Called after a submission's verdict is ACCEPTED. Updates XP/level/streak,
 * marks the daily streak row, awards badges that are now unlocked.
 *
 * Idempotent on a given submissionId: if XP was already credited it's a no-op.
 * Phase 1 ignores re-solves (only first AC per problem credits XP).
 */
export async function onAcceptedSubmission(submissionId: string): Promise<void> {
  const sub = await prisma.problemSolution.findUnique({
    where: { id: submissionId },
    select: { id: true, userId: true, problemId: true, verdict: true, problem: { select: { difficulty: true } } },
  });
  if (!sub || sub.verdict !== Verdict.ACCEPTED) return;

  // First-AC check: do they already have a prior ACCEPTED submission for this problem?
  const earlier = await prisma.problemSolution.findFirst({
    where: {
      userId: sub.userId,
      problemId: sub.problemId,
      verdict: Verdict.ACCEPTED,
      id: { not: sub.id },
    },
    select: { id: true },
  });
  if (earlier) return;

  const xp = XP_PER_VERDICT[sub.problem.difficulty.toLowerCase() as keyof typeof XP_PER_VERDICT] ?? 0;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  await prisma.$transaction(async (tx) => {
    // Streak: was yesterday a streak day?
    const yesterday = new Date(today);
    yesterday.setUTCDate(today.getUTCDate() - 1);
    const yesterdayStreak = await tx.dailyStreak.findUnique({
      where: { userId_date: { userId: sub.userId, date: yesterday } },
    });
    const profile = await tx.userProfile.findUnique({ where: { userId: sub.userId } });
    const newStreakDays = (yesterdayStreak ? profile?.streakDays ?? 0 : 0) + 1;
    const streakBonus = newStreakDays > 1 ? STREAK_BONUS : 0;
    const totalGain = xp + streakBonus;

    await tx.dailyStreak.upsert({
      where: { userId_date: { userId: sub.userId, date: today } },
      create: { userId: sub.userId, date: today, problemsSolved: 1, xpEarned: totalGain },
      update: { problemsSolved: { increment: 1 }, xpEarned: { increment: totalGain } },
    });

    const newXp = (profile?.currentXp ?? 0) + totalGain;
    const newLevel = levelForXp(newXp);
    const newLongest = Math.max(profile?.longestStreak ?? 0, newStreakDays);

    await tx.userProfile.upsert({
      where: { userId: sub.userId },
      create: {
        userId: sub.userId,
        currentXp: totalGain,
        level: levelForXp(totalGain),
        streakDays: newStreakDays,
        longestStreak: newStreakDays,
        totalSolved: 1,
      },
      update: {
        currentXp: newXp,
        level: newLevel,
        streakDays: newStreakDays,
        longestStreak: newLongest,
        totalSolved: { increment: 1 },
      },
    });
  });

  // Badge evaluation runs after the transaction (it's read-heavy + idempotent).
  await evaluateBadges(sub.userId);
}

async function evaluateBadges(userId: string) {
  const [profile, totals] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.problemSolution.groupBy({
      by: ["problemId", "verdict"],
      where: { userId, verdict: Verdict.ACCEPTED },
      _count: true,
    }),
  ]);
  if (!profile) return;
  const acceptedCount = totals.length;

  // Pull difficulty breakdown of accepted solves.
  const accepted = await prisma.problemSolution.findMany({
    where: { userId, verdict: Verdict.ACCEPTED },
    distinct: ["problemId"],
    select: { problem: { select: { difficulty: true } } },
  });
  const byDiff = accepted.reduce<Record<Difficulty, number>>(
    (a, s) => ({ ...a, [s.problem.difficulty]: (a[s.problem.difficulty] ?? 0) + 1 }),
    {} as Record<Difficulty, number>,
  );

  const unlocks: string[] = [];
  if (acceptedCount >= 1)               unlocks.push("first-blood");
  if (acceptedCount >= 10)              unlocks.push("ten-solved");
  if (acceptedCount >= 50)              unlocks.push("fifty-solved");
  if (acceptedCount >= 100)             unlocks.push("century");
  if ((byDiff.HARD ?? 0) >= 1)          unlocks.push("first-hard");
  if ((byDiff.HARD ?? 0) >= 10)         unlocks.push("hard-hitter");
  if (profile.streakDays >= 7)          unlocks.push("week-warrior");
  if (profile.streakDays >= 30)         unlocks.push("month-monk");

  if (unlocks.length === 0) return;
  const badges = await prisma.badge.findMany({ where: { slug: { in: unlocks } } });
  for (const b of badges) {
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId, badgeId: b.id } },
      create: { userId, badgeId: b.id },
      update: {},
    });
  }
}
