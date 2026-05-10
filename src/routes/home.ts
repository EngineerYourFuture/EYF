import { Router, Response } from "express";
import { Plan } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /home/summary
router.get("/summary", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.auth!.sub;

  const [user, xp, dailyUsage, entitlements] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { email: true, plan: true } }),
    prisma.userXP.findUnique({ where: { userId } }),
    prisma.dailySubmissionUsage.findUnique({
      where: { userId_date: { userId, date: new Date().toISOString().slice(0, 10) } },
    }),
    prisma.planEntitlement.findMany({
      where: { plan: req.auth!.plan as Plan, featureKey: "dsa_daily_submissions" },
    }),
  ]);

  if (!user) { res.status(404).json({ error: { code: "NOT_FOUND", message: "User not found." } }); return; }

  const dsaDailyLimit = entitlements[0]?.limitValue ?? null;

  res.json({
    user: { plan: user.plan, email: user.email },
    summary: {
      xp: xp?.totalXp ?? 0,
      streak: xp?.streak ?? 0,
      dsaDailyUsage: dailyUsage?.count ?? 0,
      dsaDailyLimit,
    },
  });
});

// GET /modules/status
router.get("/modules-status", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.auth!.sub;
  const MODULE_KEYS = ["dsa", "core-subjects", "placement", "resume-builder", "tech-skills", "mentorship", "visualizer"];

  const progress = await prisma.moduleProgress.findMany({ where: { userId } });
  const progressMap = new Map(progress.map((p) => [p.moduleKey, p]));

  const items = MODULE_KEYS.map((module) => {
    const p = progressMap.get(module);
    return {
      module,
      unlocked: true,
      progress: p?.completionPct ?? 0,
      cta: p?.status === "completed" ? "Review" : p?.status === "in_progress" ? "Continue" : "Start",
    };
  });

  res.json({ items });
});

export { router as homeRouter };
