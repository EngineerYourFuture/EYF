import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest, asStr } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { NotFoundError } from "../lib/AppError";

const router = Router();

const progressSchema = z.object({ status: z.enum(["in_progress", "completed"]) });

router.get("/patterns", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const category = asStr(req.query.category as string | string[] | undefined) || undefined;
  const where = category ? { category } : {};

  const patterns = await prisma.designPatternLesson.findMany({
    where,
    orderBy: [{ category: "asc" }, { orderIndex: "asc" }],
    select: { id: true, patternKey: true, name: true, category: true, description: true, planAccess: true, orderIndex: true },
  });

  const progress = await prisma.userOOPProgress.findMany({
    where: { userId: req.auth!.sub },
    select: { patternId: true, status: true },
  });
  const progressMap = new Map(progress.map((p) => [p.patternId, p.status]));
  res.json({ patterns: patterns.map((p) => ({ ...p, status: progressMap.get(p.id) ?? "not_started" })) });
});

router.get("/patterns/:key", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const key = String(req.params.key);
  const pattern = await prisma.designPatternLesson.findUnique({ where: { patternKey: key } });
  if (!pattern) throw new NotFoundError("Pattern");

  const prog = await prisma.userOOPProgress.findUnique({
    where: { userId_patternId: { userId: req.auth!.sub, patternId: pattern.id } },
  });
  res.json({ pattern, status: prog?.status ?? "not_started", completedAt: prog?.completedAt ?? null });
});

router.post("/patterns/:key/progress", requireAuth("public"), validate(progressSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  const { status } = req.body as z.infer<typeof progressSchema>;
  const key = String(req.params.key);

  const pattern = await prisma.designPatternLesson.findUnique({ where: { patternKey: key }, select: { id: true } });
  if (!pattern) throw new NotFoundError("Pattern");

  const prog = await prisma.userOOPProgress.upsert({
    where: { userId_patternId: { userId: req.auth!.sub, patternId: pattern.id } },
    update: { status, completedAt: status === "completed" ? new Date() : null },
    create: { userId: req.auth!.sub, patternId: pattern.id, status, completedAt: status === "completed" ? new Date() : null },
  });
  res.json({ status: prog.status, completedAt: prog.completedAt });
});

router.get("/solid", requireAuth("public"), async (_req: AuthRequest, res: Response): Promise<void> => {
  const lessons = await prisma.solidPrincipleLesson.findMany({ orderBy: { orderIndex: "asc" } });
  res.json({ lessons });
});

router.get("/solid/:key", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const key = String(req.params.key);
  const lesson = await prisma.solidPrincipleLesson.findUnique({ where: { principleKey: key } });
  if (!lesson) throw new NotFoundError("Lesson");
  res.json({ lesson });
});

router.get("/progress", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const [total, completed] = await Promise.all([
    prisma.designPatternLesson.count(),
    prisma.userOOPProgress.count({ where: { userId: req.auth!.sub, status: "completed" } }),
  ]);

  const byCategory = await prisma.designPatternLesson.groupBy({ by: ["category"], _count: { id: true } });
  const completedByCategory = await prisma.userOOPProgress.findMany({
    where: { userId: req.auth!.sub, status: "completed" },
    include: { pattern: { select: { category: true } } },
  });
  const catMap = new Map<string, number>();
  completedByCategory.forEach((p) => catMap.set(p.pattern.category, (catMap.get(p.pattern.category) ?? 0) + 1));

  res.json({
    total, completed,
    pct: total > 0 ? Math.round((completed / total) * 100) : 0,
    categories: byCategory.map((c) => ({ category: c.category, total: c._count.id, completed: catMap.get(c.category) ?? 0 })),
  });
});

export const oopRouter = router;
