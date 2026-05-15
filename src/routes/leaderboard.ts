import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest, asStr } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const period = asStr(req.query.period as string | string[] | undefined) || "alltime";
  const userId = req.auth!.sub;

  const orderBy = period === "weekly" ? { weeklyXp: "desc" as const } : { totalXp: "desc" as const };
  const xpField = period === "weekly" ? "weeklyXp" : "totalXp";

  const top = await prisma.userXP.findMany({
    orderBy,
    take: 50,
    include: {
      user: { select: { email: true, name: true } },
    },
  });

  const entries = top.map((entry, i) => ({
    rank: i + 1,
    userId: entry.userId,
    name: entry.user.name ?? entry.user.email.split("@")[0],
    xp: period === "weekly" ? entry.weeklyXp : entry.totalXp,
    streak: entry.streak,
    isCurrentUser: entry.userId === userId,
  }));

  // Find current user's rank if not in top 50
  const currentUserInTop = entries.find((e) => e.userId === userId);
  let currentUserRank = null;

  if (!currentUserInTop) {
    const userXp = await prisma.userXP.findUnique({ where: { userId } });
    if (userXp) {
      const xpVal = period === "weekly" ? userXp.weeklyXp : userXp.totalXp;
      const rank = await prisma.userXP.count({
        where: { [xpField]: { gt: xpVal } },
      });
      currentUserRank = {
        rank: rank + 1,
        userId,
        xp: xpVal,
        streak: userXp.streak,
        isCurrentUser: true,
      };
    }
  }

  res.json({ period, entries, currentUserRank });
});

export const leaderboardRouter = router;
