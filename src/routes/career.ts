import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest, asStr } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { NotFoundError } from "../lib/AppError";

const router = Router();

const careerProfileSchema = z.object({
  track: z.enum(["student", "professional", "expert"]).optional(),
  currentRole: z.string().max(100).optional(),
  targetRole: z.string().max(100).optional(),
  experienceYears: z.number().int().min(0).max(50).optional(),
  currentCompany: z.string().max(100).optional(),
  linkedinUrl: z.string().max(500).optional(),
  githubUrl: z.string().max(500).optional(),
  skills: z.array(z.string().max(50)).max(30).optional(),
  interests: z.array(z.string().max(50)).max(20).optional(),
  targetTimeline: z.string().datetime().optional().nullable(),
});

router.get("/profile", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const profile = await prisma.userCareerProfile.findUnique({ where: { userId: req.auth!.sub } });
  res.json({ profile: profile ?? null });
});

router.put("/profile", requireAuth("public"), validate(careerProfileSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  const { targetTimeline, ...rest } = req.body as z.infer<typeof careerProfileSchema>;
  const data = { ...rest, targetTimeline: targetTimeline ? new Date(targetTimeline) : null };

  const profile = await prisma.userCareerProfile.upsert({
    where: { userId: req.auth!.sub },
    update: data,
    create: { userId: req.auth!.sub, ...data },
  });
  res.json({ profile });
});

router.get("/paths", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const track = asStr(req.query.track as string | string[] | undefined) || undefined;
  const where = track ? { targetTrack: track } : {};

  const paths = await prisma.learningPath.findMany({ where, orderBy: { estimatedWeeks: "asc" } });
  const enrollments = await prisma.userLearningPath.findMany({
    where: { userId: req.auth!.sub },
    select: { pathId: true, progress: true, startedAt: true, completedAt: true },
  });
  const enrollMap = new Map(enrollments.map((e) => [e.pathId, e]));

  res.json({
    paths: paths.map((p) => {
      const enroll = enrollMap.get(p.id);
      return { ...p, enrolled: !!enroll, progress: enroll?.progress ?? 0, startedAt: enroll?.startedAt ?? null };
    }),
  });
});

router.get("/paths/:slug", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const slug = String(req.params.slug);
  const path = await prisma.learningPath.findUnique({ where: { slug } });
  if (!path) throw new NotFoundError("Path");

  const enrollment = await prisma.userLearningPath.findUnique({
    where: { userId_pathId: { userId: req.auth!.sub, pathId: path.id } },
  });
  res.json({ path, enrollment: enrollment ?? null });
});

router.post("/paths/:slug/enroll", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const slug = String(req.params.slug);
  const path = await prisma.learningPath.findUnique({ where: { slug }, select: { id: true } });
  if (!path) throw new NotFoundError("Path");

  const enrollment = await prisma.userLearningPath.upsert({
    where: { userId_pathId: { userId: req.auth!.sub, pathId: path.id } },
    update: {},
    create: { userId: req.auth!.sub, pathId: path.id },
  });
  res.status(201).json({ enrolled: true, startedAt: enrollment.startedAt });
});

export const careerRouter = router;
