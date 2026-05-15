import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest, asStr } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { reviewLimiter } from "../middleware/rateLimiter";
import { NotFoundError, ForbiddenError, ConflictError } from "../lib/AppError";

const router = Router();

const profileSchema = z.object({
  displayName: z.string().min(2).max(80),
  title: z.string().min(2).max(120),
  company: z.string().max(100).optional(),
  bio: z.string().min(20).max(2000),
  specializations: z.array(z.string().max(50)).min(1).max(10),
  yearsExperience: z.number().int().min(0).max(50),
  linkedinUrl: z.string().max(500).optional(),
  githubUrl: z.string().max(500).optional(),
  available: z.boolean().optional(),
  hourlyRate: z.number().int().min(0).max(10000).optional().nullable(),
});

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

router.get("/", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const specialization = asStr(req.query.specialization as string | string[] | undefined) || undefined;
  const availableStr = asStr(req.query.available as string | string[] | undefined);

  const where: Record<string, unknown> = {};
  if (availableStr === "true") where.available = true;
  if (specialization) where.specializations = { has: specialization };

  const experts = await prisma.expertProfile.findMany({
    where,
    orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
    select: {
      id: true, userId: true, displayName: true, title: true, company: true, bio: true,
      specializations: true, yearsExperience: true, available: true, hourlyRate: true,
      rating: true, reviewCount: true,
    },
  });
  res.json({ experts });
});

router.get("/:id", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const expert = await prisma.expertProfile.findUnique({
    where: { id },
    include: {
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { user: { select: { email: true } } },
      },
    },
  });
  if (!expert) throw new NotFoundError("Expert");

  res.json({
    ...expert,
    reviews: expert.reviews.map((r) => ({
      id: r.id, rating: r.rating, comment: r.comment, createdAt: r.createdAt,
      reviewer: r.user.email.split("@")[0],
    })),
  });
});

router.post("/profile", requireAuth("public"), validate(profileSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  const existing = await prisma.expertProfile.findUnique({ where: { userId: req.auth!.sub } });
  if (existing) throw new ConflictError("EXPERT_EXISTS", "Expert profile already exists.");

  const profile = await prisma.expertProfile.create({ data: { userId: req.auth!.sub, ...req.body } });
  res.status(201).json({ profile });
});

router.put("/profile", requireAuth("public"), validate(profileSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  const profile = await prisma.expertProfile.upsert({
    where: { userId: req.auth!.sub },
    update: req.body,
    create: { userId: req.auth!.sub, ...req.body },
  });
  res.json({ profile });
});

router.post(
  "/:id/review",
  requireAuth("public"),
  reviewLimiter,
  validate(reviewSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const expertId = String(req.params.id);
    const { rating, comment } = req.body as z.infer<typeof reviewSchema>;

    const expert = await prisma.expertProfile.findUnique({ where: { id: expertId }, select: { id: true, userId: true } });
    if (!expert) throw new NotFoundError("Expert");
    if (expert.userId === req.auth!.sub) throw new ForbiddenError("You cannot review your own profile.");

    const review = await prisma.expertReview.upsert({
      where: { userId_expertId: { userId: req.auth!.sub, expertId: expert.id } },
      update: { rating, comment: comment ?? null },
      create: { userId: req.auth!.sub, expertId: expert.id, rating, comment: comment ?? null },
    });

    const agg = await prisma.expertReview.aggregate({
      where: { expertId: expert.id },
      _avg: { rating: true },
      _count: { id: true },
    });
    await prisma.expertProfile.update({
      where: { id: expert.id },
      data: { rating: agg._avg.rating ?? 0, reviewCount: agg._count.id },
    });

    res.status(201).json({ review: { id: review.id, rating, comment, createdAt: review.createdAt } });
  }
);

export const expertsRouter = router;
