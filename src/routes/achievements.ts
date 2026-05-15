import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { xpService } from "../services/XPService";

const router = Router();

router.get("/", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.auth!.sub;

  const [all, earned, xpRecord] = await Promise.all([
    prisma.achievement.findMany({ orderBy: [{ category: "asc" }, { xpReward: "asc" }] }),
    prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { earnedAt: "desc" },
    }),
    prisma.userXP.findUnique({ where: { userId } }),
  ]);

  const earnedMap = new Map(earned.map((e) => [e.achievementId, e.earnedAt]));
  const totalXp = xpRecord?.totalXp ?? 0;
  const level = xpService.levelFromXp(totalXp);

  res.json({
    level,
    totalXp,
    streak: xpRecord?.streak ?? 0,
    longestStreak: xpRecord?.longestStreak ?? 0,
    achievements: all.map((a) => ({
      ...a,
      earned: earnedMap.has(a.id),
      earnedAt: earnedMap.get(a.id) ?? null,
    })),
    earnedCount: earned.length,
    totalCount: all.length,
  });
});

export const achievementsRouter = router;
