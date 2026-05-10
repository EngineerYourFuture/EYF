import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest, asStr } from "../middleware/auth";

const router = Router();

const COMPANY_TRACKS = [
  { id: "faang", company: "FAANG+", level: "sde-1", focus: ["algorithms", "system-design", "behavioral"] },
  { id: "product", company: "Product Companies", level: "sde-1", focus: ["algorithms", "coding", "product-thinking"] },
  { id: "startup", company: "Startups", level: "sde-1", focus: ["coding", "system-design", "culture-fit"] },
  { id: "service", company: "Service Companies", level: "intern", focus: ["algorithms", "coding", "aptitude"] },
];

// GET /placement/tracks
router.get("/tracks", requireAuth("public"), async (_req: AuthRequest, res: Response): Promise<void> => {
  res.json({ tracks: COMPANY_TRACKS });
});

// GET /placement/tracks/:id
router.get("/tracks/:id", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const track = COMPANY_TRACKS.find((t) => t.id === req.params.id);
  if (!track) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Track not found." } });
    return;
  }
  res.json({ track });
});

// GET /placement/attempts
router.get("/attempts", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const attempts = await prisma.placementAttempt.findMany({
    where: { userId: req.auth!.sub },
    orderBy: { createdAt: "desc" },
  });
  res.json({ attempts });
});

const AttemptSchema = z.object({
  company: z.string().min(1).max(100),
  role: z.string().min(1).max(100),
  kind: z.enum(["placement", "mock"]),
  outcome: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

// POST /placement/attempts
router.post("/attempts", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const parse = AttemptSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: { code: "VALIDATION", message: parse.error.issues[0]?.message } });
    return;
  }

  // Check mock interview entitlement
  if (parse.data.kind === "mock") {
    const entitlement = await prisma.planEntitlement.findUnique({
      where: { plan_featureKey: { plan: req.auth!.plan as never, featureKey: "mock_interviews" } },
    });
    if (!entitlement?.enabled || entitlement.limitValue === 0) {
      res.status(403).json({ error: { code: "PLAN_REQUIRED", message: "Mock interviews require Pro plan or above." } });
      return;
    }
  }

  const attempt = await prisma.placementAttempt.create({
    data: { userId: req.auth!.sub, ...parse.data },
  });

  res.status(201).json({ attempt });
});

// PATCH /placement/attempts/:id
router.patch("/attempts/:id", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const attempt = await prisma.placementAttempt.findUnique({ where: { id: String(req.params.id) } });
  if (!attempt || attempt.userId !== req.auth!.sub) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Attempt not found." } });
    return;
  }

  const { outcome, notes } = req.body;
  const updated = await prisma.placementAttempt.update({
    where: { id: attempt.id },
    data: { outcome, notes },
  });
  res.json({ attempt: updated });
});

export { router as placementRouter };
