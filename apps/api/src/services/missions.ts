/**
 * Daily Mission — spec PROBLEM #10 (retention). Three small, real tasks the
 * user can clear in one sitting; completing all three claims a bonus XP reward
 * once per day. Tasks auto-complete from genuine activity (no busy-work), and
 * the bonus claim is idempotent via the unique (userId, date) on MissionDay.
 */
import { prisma, Verdict } from "@eyf/db";
import { levelForXp } from "@eyf/types";

export type MissionTask = {
  key: string; label: string; detail: string; href: string; icon: string;
  xp: number; done: boolean;
};
export type DailyMission = {
  date: string;
  tasks: MissionTask[];
  earnedXp: number;   // xp from tasks already cleared today
  bonusXp: number;    // completion bonus on offer
  allDone: boolean;
  claimed: boolean;
};

const BONUS_XP = 75;

function dayBounds() {
  const start = new Date(); start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start); end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

export async function getDailyMission(userId: string): Promise<DailyMission> {
  const { start, end } = dayBounds();
  const [solvedToday, reviewedToday, gameToday, assessToday, claim] = await Promise.all([
    prisma.problemSolution.count({ where: { userId, verdict: Verdict.ACCEPTED, submittedAt: { gte: start, lt: end } } }),
    prisma.flashcardReview.count({ where: { userId, lastReviewedAt: { gte: start, lt: end } } }),
    prisma.cognitiveSession.count({ where: { userId, playedAt: { gte: start, lt: end } } }),
    prisma.assessmentSession.count({ where: { userId, completedAt: { gte: start, lt: end } } }),
    prisma.missionDay.findUnique({ where: { userId_date: { userId, date: start } } }),
  ]);

  const tasks: MissionTask[] = [
    { key: "solve", label: "Solve a problem", detail: "Keep your DSA sharp", href: "/problems", icon: "code", xp: 20, done: solvedToday > 0 },
    { key: "revise", label: "Review 3 flashcards", detail: "Lock in core CS with spaced repetition", href: "/subjects", icon: "book", xp: 15, done: reviewedToday >= 3 },
    { key: "sharpen", label: "Train or assess", detail: "A brain game or a quick assessment", href: "/games", icon: "brain", xp: 15, done: gameToday + assessToday > 0 },
  ];
  const allDone = tasks.every((t) => t.done);
  const earnedXp = tasks.filter((t) => t.done).reduce((a, t) => a + t.xp, 0);
  return { date: start.toISOString().slice(0, 10), tasks, earnedXp, bonusXp: BONUS_XP, allDone, claimed: !!claim };
}

export async function claimDailyMission(
  userId: string,
): Promise<{ claimed: boolean; awardedXp: number; reason?: "incomplete" | "already-claimed" }> {
  const mission = await getDailyMission(userId);
  if (!mission.allDone) return { claimed: false, awardedXp: 0, reason: "incomplete" };
  if (mission.claimed) return { claimed: false, awardedXp: 0, reason: "already-claimed" };

  const { start } = dayBounds();
  try {
    await prisma.$transaction(async (tx) => {
      // Unique (userId, date) makes this the idempotency guard — a racing claim throws here.
      await tx.missionDay.create({ data: { userId, date: start, bonusXp: BONUS_XP } });
      const profile = await tx.userProfile.findUnique({ where: { userId } });
      const newXp = (profile?.currentXp ?? 0) + BONUS_XP;
      await tx.userProfile.update({ where: { userId }, data: { currentXp: newXp, level: levelForXp(newXp) } });
      await tx.dailyStreak.upsert({
        where: { userId_date: { userId, date: start } },
        create: { userId, date: start, xpEarned: BONUS_XP },
        update: { xpEarned: { increment: BONUS_XP } },
      });
    });
    return { claimed: true, awardedXp: BONUS_XP };
    /* c8 ignore start -- concurrency guard: the catch fires only when a racing
       claim wins the unique (userId,date) insert between getDailyMission and here. */
  } catch {
    return { claimed: false, awardedXp: 0, reason: "already-claimed" };
  }
  /* c8 ignore stop */
}
