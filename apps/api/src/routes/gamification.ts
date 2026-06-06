import type { FastifyInstance } from "fastify";
import { prisma } from "@eyf/db";
import { xpForLevel, levelForXp } from "@eyf/types";

export async function gamificationRoutes(app: FastifyInstance) {
  app.get("/badges", async () => {
    const badges = await prisma.badge.findMany({ orderBy: [{ tier: "asc" }, { name: "asc" }] });
    return { success: true, data: badges };
  });

  app.get("/me", { preHandler: app.requireAuth }, async (req) => {
    const [profile, userBadges] = await Promise.all([
      prisma.userProfile.findUnique({ where: { userId: req.session!.id } }),
      prisma.userBadge.findMany({
        where: { userId: req.session!.id },
        include: { badge: true },
        orderBy: { earnedAt: "desc" },
      }),
    ]);
    const xp = profile?.currentXp ?? 0;
    const level = levelForXp(xp);
    return {
      success: true,
      data: {
        xp,
        level,
        xpAtLevel: xp - xpForLevel(level),
        xpToNext: xpForLevel(level + 1) - xp,
        streak: profile?.streakDays ?? 0,
        longestStreak: profile?.longestStreak ?? 0,
        totalSolved: profile?.totalSolved ?? 0,
        badges: userBadges.map((ub) => ({ ...ub.badge, earnedAt: ub.earnedAt })),
      },
    };
  });

  app.get("/leaderboard", async () => {
    const top = await prisma.userProfile.findMany({
      orderBy: { currentXp: "desc" },
      take: 50,
      include: { user: { select: { name: true, college: true } } },
    });
    return {
      success: true,
      data: top.map((p, i) => ({
        rank: i + 1,
        name: p.user.name,
        college: p.user.college,
        xp: p.currentXp,
        level: p.level,
        streak: p.streakDays,
      })),
    };
  });

  app.get("/streak", { preHandler: app.requireAuth }, async (req) => {
    const since = new Date();
    since.setDate(since.getDate() - 365);
    const days = await prisma.dailyStreak.findMany({
      where: { userId: req.session!.id, date: { gte: since } },
      orderBy: { date: "asc" },
      select: { date: true, problemsSolved: true, xpEarned: true },
    });
    return { success: true, data: days };
  });
}
