import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@eyf/db";
import { pickDailyChallenge } from "../services/daily.js";
import { generateRoadmap } from "../services/roadmap-generator.js";

export async function roadmapRoutes(app: FastifyInstance) {
  app.get("/me", { preHandler: app.requireAuth }, async (req) => {
    const roadmaps = await prisma.userRoadmap.findMany({
      where: { userId: req.session!.id },
      orderBy: { startedAt: "desc" },
    });
    return { success: true, data: roadmaps };
  });

  // Personalized Roadmap Engine — generate + persist a week-by-week plan.
  app.post("/generate", { preHandler: app.requireAuth }, async (req) => {
    const input = z.object({
      trackSlug: z.string(),
      targetCompany: z.string().optional().nullable(),
      weeks: z.coerce.number().min(4).max(24),
      hoursPerDay: z.coerce.number().min(1).max(8),
    }).parse(req.body);
    const userId = req.session!.id;
    const generated = await generateRoadmap(userId, input);
    // One active personalized plan at a time — replace any prior one.
    await prisma.userRoadmap.deleteMany({ where: { userId, templateSlug: "personalized" } });
    const roadmap = await prisma.userRoadmap.create({
      data: {
        userId, templateSlug: "personalized",
        title: generated.title, targetRole: generated.targetRole,
        targetCompany: generated.targetCompany, weeks: generated.weeks,
        hoursPerDay: generated.hoursPerDay, plan: generated.plan,
      },
    });
    return { success: true, data: { roadmap, generated } };
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
