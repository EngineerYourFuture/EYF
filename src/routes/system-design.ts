import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest, asStr } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { NotFoundError } from "../lib/AppError";

const router = Router();

const attemptSchema = z.object({ response: z.string().min(10).max(20000) });

router.get("/questions", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const category = asStr(req.query.category as string | string[] | undefined) || undefined;
  const difficulty = asStr(req.query.difficulty as string | string[] | undefined) || undefined;

  const where: Record<string, string> = {};
  if (category) where.category = category;
  if (difficulty) where.difficulty = difficulty;

  const questions = await prisma.systemDesignQuestion.findMany({
    where,
    orderBy: [{ difficulty: "asc" }, { category: "asc" }],
    select: { id: true, slug: true, title: true, category: true, difficulty: true, description: true, planAccess: true },
  });

  const attempts = await prisma.systemDesignAttempt.findMany({
    where: { userId: req.auth!.sub },
    select: { questionId: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    distinct: ["questionId"],
  });
  const attemptMap = new Map(attempts.map((a) => [a.questionId, a.createdAt]));

  res.json({
    questions: questions.map((q) => ({ ...q, attempted: attemptMap.has(q.id), lastAttemptAt: attemptMap.get(q.id) ?? null })),
  });
});

router.get("/questions/:slug", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const slug = String(req.params.slug);
  const question = await prisma.systemDesignQuestion.findUnique({ where: { slug } });
  if (!question) throw new NotFoundError("Question");

  const attempts = await prisma.systemDesignAttempt.findMany({
    where: { userId: req.auth!.sub, questionId: question.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, response: true, createdAt: true },
  });
  res.json({ question, attempts });
});

router.post("/questions/:slug/attempt", requireAuth("public"), validate(attemptSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  const slug = String(req.params.slug);
  const { response } = req.body as z.infer<typeof attemptSchema>;

  const question = await prisma.systemDesignQuestion.findUnique({ where: { slug }, select: { id: true } });
  if (!question) throw new NotFoundError("Question");

  const attempt = await prisma.systemDesignAttempt.create({
    data: { userId: req.auth!.sub, questionId: question.id, response },
  });
  res.status(201).json({ attemptId: attempt.id, createdAt: attempt.createdAt });
});

router.get("/stats", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const [total, attempted] = await Promise.all([
    prisma.systemDesignQuestion.count(),
    prisma.systemDesignAttempt.groupBy({ by: ["questionId"], where: { userId: req.auth!.sub } }),
  ]);
  const byCategory = await prisma.systemDesignQuestion.groupBy({ by: ["category"], _count: { id: true } });
  res.json({ total, attempted: attempted.length, categories: byCategory });
});

export const systemDesignRouter = router;
