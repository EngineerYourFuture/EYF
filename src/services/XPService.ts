import { prisma } from "../lib/prisma";

export const XP_REWARDS = {
  dsa_solve_easy: 20,
  dsa_solve_medium: 50,
  dsa_solve_hard: 100,
  oop_pattern_complete: 30,
  security_lesson_complete: 25,
  ctf_solve: 75,
  system_design_attempt: 40,
  community_post: 10,
  community_vote_received: 2,
  career_path_enroll: 15,
  daily_login: 5,
} as const;

export type XPAction = keyof typeof XP_REWARDS;

const ACHIEVEMENT_CHECKS: {
  key: string;
  check: (userId: string) => Promise<boolean>;
}[] = [
  {
    key: "first_blood",
    check: async (userId) => {
      const count = await prisma.submission.count({ where: { userId, status: "accepted" } });
      return count >= 1;
    },
  },
  {
    key: "dsa_10",
    check: async (userId) => {
      const count = await prisma.submission.count({ where: { userId, status: "accepted" } });
      return count >= 10;
    },
  },
  {
    key: "dsa_50",
    check: async (userId) => {
      const count = await prisma.submission.count({ where: { userId, status: "accepted" } });
      return count >= 50;
    },
  },
  {
    key: "pattern_collector",
    check: async (userId) => {
      const count = await prisma.userOOPProgress.count({ where: { userId, status: "completed" } });
      return count >= 5;
    },
  },
  {
    key: "gof_master",
    check: async (userId) => {
      const [completed, total] = await Promise.all([
        prisma.userOOPProgress.count({ where: { userId, status: "completed" } }),
        prisma.designPatternLesson.count(),
      ]);
      return completed >= total && total > 0;
    },
  },
  {
    key: "solid_foundation",
    check: async (userId) => {
      const total = await prisma.solidPrincipleLesson.count();
      return total > 0;
    },
  },
  {
    key: "security_rookie",
    check: async (userId) => {
      const count = await prisma.userSecurityProgress.count({ where: { userId, status: "completed" } });
      return count >= 1;
    },
  },
  {
    key: "flag_hunter",
    check: async (userId) => {
      const count = await prisma.cTFAttempt.count({ where: { userId, solved: true } });
      return count >= 1;
    },
  },
  {
    key: "ctf_elite",
    check: async (userId) => {
      const count = await prisma.cTFAttempt.count({ where: { userId, solved: true } });
      return count >= 5;
    },
  },
  {
    key: "system_thinker",
    check: async (userId) => {
      const count = await prisma.systemDesignAttempt.count({ where: { userId } });
      return count >= 1;
    },
  },
  {
    key: "architect",
    check: async (userId) => {
      const [attempted, total] = await Promise.all([
        prisma.systemDesignAttempt.groupBy({ by: ["questionId"], where: { userId } }),
        prisma.systemDesignQuestion.count(),
      ]);
      return attempted.length >= total && total > 0;
    },
  },
  {
    key: "community_voice",
    check: async (userId) => {
      const count = await prisma.communityPost.count({ where: { userId, parentId: null } });
      return count >= 1;
    },
  },
  {
    key: "streak_7",
    check: async (userId) => {
      const xp = await prisma.userXP.findUnique({ where: { userId } });
      return (xp?.streak ?? 0) >= 7;
    },
  },
  {
    key: "streak_30",
    check: async (userId) => {
      const xp = await prisma.userXP.findUnique({ where: { userId } });
      return (xp?.streak ?? 0) >= 30;
    },
  },
  {
    key: "path_pioneer",
    check: async (userId) => {
      const count = await prisma.userLearningPath.count({ where: { userId } });
      return count >= 1;
    },
  },
];

export class XPService {
  async award(userId: string, action: XPAction): Promise<{ newXp: number; newAchievements: string[] }> {
    const amount = XP_REWARDS[action];
    const today = new Date().toISOString().slice(0, 10);

    const xp = await prisma.userXP.upsert({
      where: { userId },
      update: { totalXp: { increment: amount }, weeklyXp: { increment: amount } },
      create: { userId, totalXp: amount, weeklyXp: amount, lastActivityDate: new Date() },
    });

    // Streak logic
    const lastDate = xp.lastActivityDate?.toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    if (lastDate !== today) {
      const newStreak = lastDate === yesterday ? (xp.streak + 1) : 1;
      await prisma.userXP.update({
        where: { userId },
        data: {
          streak: newStreak,
          longestStreak: Math.max(newStreak, xp.longestStreak),
          lastActivityDate: new Date(),
        },
      });
    }

    // Check achievements
    const newAchievements: string[] = [];
    const alreadyEarned = await prisma.userAchievement.findMany({
      where: { userId },
      select: { achievement: { select: { key: true } } },
    });
    const earnedKeys = new Set(alreadyEarned.map((a) => a.achievement.key));

    for (const { key, check } of ACHIEVEMENT_CHECKS) {
      if (earnedKeys.has(key)) continue;
      const unlocked = await check(userId);
      if (!unlocked) continue;

      const achievement = await prisma.achievement.findUnique({ where: { key } });
      if (!achievement) continue;

      await prisma.userAchievement.create({
        data: { userId, achievementId: achievement.id, xpId: xp.id },
      });

      // Bonus XP for the achievement
      if (achievement.xpReward > 0) {
        await prisma.userXP.update({
          where: { userId },
          data: { totalXp: { increment: achievement.xpReward }, weeklyXp: { increment: achievement.xpReward } },
        });
      }

      newAchievements.push(key);
    }

    const updated = await prisma.userXP.findUnique({ where: { userId } });
    return { newXp: updated?.totalXp ?? 0, newAchievements };
  }

  levelFromXp(xp: number): { level: number; name: string; nextLevelXp: number; currentLevelXp: number } {
    const thresholds = [0, 100, 300, 700, 1500, 3000, 6000, 12000, 25000, 50000, 100000];
    const names = ["Newcomer", "Learner", "Explorer", "Builder", "Practitioner", "Engineer", "Senior", "Lead", "Architect", "Expert", "Legend"];
    let level = 0;
    for (let i = 0; i < thresholds.length; i++) {
      if (xp >= thresholds[i]) level = i;
    }
    return {
      level,
      name: names[level],
      currentLevelXp: thresholds[level],
      nextLevelXp: thresholds[level + 1] ?? thresholds.at(-1)!,
    };
  }
}

export const xpService = new XPService();
