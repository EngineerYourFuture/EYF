import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@eyf/db";
import { pickDailyChallenge } from "../services/daily.js";

export async function roadmapRoutes(app: FastifyInstance) {
  app.get("/me", { preHandler: app.requireAuth }, async (req) => {
    const roadmaps = await prisma.userRoadmap.findMany({
      where: { userId: req.session!.id },
      orderBy: { startedAt: "desc" },
    });
    return { success: true, data: roadmaps };
  });

  app.post("/start", { preHandler: app.requireAuth }, async (req) => {
    const { templateSlug, targetDate } = z
      .object({
        templateSlug: z.enum(["30-day-sprint", "60-day-sprint", "12-week-product"]),
        targetDate: z.coerce.date().optional(),
      })
      .parse(req.body);
    const roadmap = await prisma.userRoadmap.create({
      data: { userId: req.session!.id, templateSlug, targetDate },
    });
    return { success: true, data: roadmap };
  });

  app.get("/today", { preHandler: app.requireAuth }, async (req) => {
    const userId = req.session!.id;
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const [challenge, todayStreak, profile] = await Promise.all([
      pickDailyChallenge(userId),
      prisma.dailyStreak.findUnique({
        where: { userId_date: { userId, date: startOfDay } },
      }),
      prisma.userProfile.findUnique({
        where: { userId },
        select: { streakDays: true, currentXp: true },
      }),
    ]);
    return {
      success: true,
      data: {
        challenge,
        streak: profile?.streakDays ?? 0,
        xpToday: todayStreak?.xpEarned ?? 0,
        problemsSolvedToday: todayStreak?.problemsSolved ?? 0,
      },
    };
  });
}
