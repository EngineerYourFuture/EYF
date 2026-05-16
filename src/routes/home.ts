import { Router, Response } from "express";
import { Plan } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { xpService } from "../services/XPService";

const router = Router();

router.get("/summary", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.auth!.sub;

  const [user, xp, dailyUsage, entitlements, earnedCount, recentAchievements] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true, plan: true } }),
    prisma.userXP.findUnique({ where: { userId } }),
    prisma.dailySubmissionUsage.findUnique({
      where: { userId_date: { userId, date: new Date().toISOString().slice(0, 10) } },
    }),
    prisma.planEntitlement.findMany({ where: { plan: req.auth!.plan as Plan, featureKey: "dsa_daily_submissions" } }),
    prisma.userAchievement.count({ where: { userId } }),
    prisma.userAchievement.findMany({
      where: { userId },
      orderBy: { earnedAt: "desc" },
      take: 3,
      include: { achievement: { select: { key: true, name: true, icon: true } } },
    }),
  ]);

  if (!user) { res.status(404).json({ error: { code: "NOT_FOUND", message: "User not found." } }); return; }

  const totalXp = xp?.totalXp ?? 0;
  const { level } = xpService.levelFromXp(totalXp);

  res.json({
    user: { plan: user.plan, email: user.email, name: user.name },
    summary: {
      xp: totalXp,
      weeklyXp: xp?.weeklyXp ?? 0,
      streak: xp?.streak ?? 0,
      longestStreak: xp?.longestStreak ?? 0,
      level,
      dsaDailyUsage: dailyUsage?.count ?? 0,
      dsaDailyLimit: entitlements[0]?.limitValue ?? null,
      achievementsEarned: earnedCount,
      recentAchievements: recentAchievements.map((a) => a.achievement),
    },
  });
});

router.get("/status", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.auth!.sub;

  const [progress, oopProgress, secProgress, ctfSolved, sdAttempts, pathsEnrolled, careerProfile] = await Promise.all([
    prisma.moduleProgress.findMany({ where: { userId } }),
    prisma.userOOPProgress.count({ where: { userId, status: "completed" } }),
    prisma.userSecurityProgress.count({ where: { userId, status: "completed" } }),
    prisma.cTFAttempt.count({ where: { userId, solved: true } }),
    prisma.systemDesignAttempt.groupBy({ by: ["questionId"], where: { userId } }),
    prisma.userLearningPath.count({ where: { userId } }),
    prisma.userCareerProfile.findUnique({ where: { userId }, select: { track: true } }),
  ]);

  const progressMap = new Map(progress.map((p) => [p.moduleKey, p]));

  const [totalPatterns, totalSecLessons, totalCTF, totalSD] = await Promise.all([
    prisma.designPatternLesson.count(),
    prisma.securityLesson.count(),
    prisma.cTFChallenge.count(),
    prisma.systemDesignQuestion.count(),
  ]);

  const moduleCta = (status: string | undefined): string => {
    if (status === "completed") return "Review";
    if (status === "in_progress") return "Continue";
    return "Start";
  };

  const coreModules = ["dsa", "core-subjects", "placement", "resume-builder", "tech-skills", "mentorship", "visualizer"];
  const coreItems = coreModules.map((module) => {
    const p = progressMap.get(module);
    return { module, progress: p?.completionPct ?? 0, cta: moduleCta(p?.status) };
  });

  const extendedItems = [
    { module: "oop", progress: totalPatterns > 0 ? Math.round((oopProgress / totalPatterns) * 100) : 0, cta: oopProgress > 0 ? "Continue" : "Start" },
    { module: "security", progress: totalSecLessons > 0 ? Math.round((secProgress / totalSecLessons) * 100) : 0, cta: secProgress > 0 ? "Continue" : "Start" },
    { module: "ctf", progress: totalCTF > 0 ? Math.round((ctfSolved / totalCTF) * 100) : 0, cta: ctfSolved > 0 ? "Continue" : "Start" },
    { module: "system-design", progress: totalSD > 0 ? Math.round((sdAttempts.length / totalSD) * 100) : 0, cta: sdAttempts.length > 0 ? "Continue" : "Start" },
    { module: "career", progress: careerProfile ? 100 : 0, cta: careerProfile ? "View" : "Set up" },
    { module: "learning-paths", progress: 0, cta: pathsEnrolled > 0 ? "Continue" : "Explore" },
  ];

  res.json({ items: [...coreItems, ...extendedItems] });
});

export { router as homeRouter };
