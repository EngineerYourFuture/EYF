import { Router, Response } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

const EventSchema = z.object({
  eventType: z.string().min(1).max(100),
  payload: z.record(z.string(), z.unknown()).optional(),
});

// POST /analytics/events
router.post("/events", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const parse = EventSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: { code: "VALIDATION", message: parse.error.issues[0]?.message } });
    return;
  }

  await prisma.analyticsEvent.create({
    data: { userId: req.auth!.sub, eventType: parse.data.eventType, payload: (parse.data.payload ?? {}) as Prisma.InputJsonValue },
  });

  res.status(202).json({ ok: true });
});

// GET /analytics/activity  (user's recent activity)
router.get("/activity", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const activity = await prisma.recentActivity.findMany({
    where: { userId: req.auth!.sub },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  res.json({ activity });
});

export { router as analyticsRouter };
