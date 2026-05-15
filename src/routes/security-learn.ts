import { Router, Response } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest, asStr } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { ctfSubmitLimiter } from "../middleware/rateLimiter";
import { NotFoundError } from "../lib/AppError";

const router = Router();

router.get("/lessons", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const category = asStr(req.query.category as string | string[] | undefined) || undefined;
  const where = category ? { category } : {};

  const lessons = await prisma.securityLesson.findMany({
    where,
    orderBy: [{ category: "asc" }, { orderIndex: "asc" }],
    select: { id: true, lessonKey: true, title: true, category: true, description: true, difficulty: true, planAccess: true, orderIndex: true },
  });

  const progress = await prisma.userSecurityProgress.findMany({
    where: { userId: req.auth!.sub },
    select: { lessonId: true, status: true },
  });
  const progressMap = new Map(progress.map((p) => [p.lessonId, p.status]));
  res.json({ lessons: lessons.map((l) => ({ ...l, status: progressMap.get(l.id) ?? "not_started" })) });
});

router.get("/lessons/:key", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const key = String(req.params.key);
  const lesson = await prisma.securityLesson.findUnique({ where: { lessonKey: key } });
  if (!lesson) throw new NotFoundError("Lesson");

  const prog = await prisma.userSecurityProgress.findUnique({
    where: { userId_lessonId: { userId: req.auth!.sub, lessonId: lesson.id } },
  });
  res.json({ lesson, status: prog?.status ?? "not_started" });
});

router.post("/lessons/:key/complete", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const key = String(req.params.key);
  const lesson = await prisma.securityLesson.findUnique({ where: { lessonKey: key }, select: { id: true } });
  if (!lesson) throw new NotFoundError("Lesson");

  const prog = await prisma.userSecurityProgress.upsert({
    where: { userId_lessonId: { userId: req.auth!.sub, lessonId: lesson.id } },
    update: { status: "completed", completedAt: new Date() },
    create: { userId: req.auth!.sub, lessonId: lesson.id, status: "completed", completedAt: new Date() },
  });
  res.json({ status: prog.status, completedAt: prog.completedAt });
});

router.get("/ctf", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const category = asStr(req.query.category as string | string[] | undefined) || undefined;
  const where = category ? { category } : {};

  const challenges = await prisma.cTFChallenge.findMany({
    where,
    orderBy: [{ category: "asc" }, { difficulty: "asc" }],
    select: { id: true, challengeKey: true, title: true, category: true, difficulty: true, description: true, points: true, hints: true, planAccess: true },
  });

  const attempts = await prisma.cTFAttempt.findMany({
    where: { userId: req.auth!.sub },
    select: { challengeId: true, solved: true, attempts: true },
  });
  const attemptMap = new Map(attempts.map((a) => [a.challengeId, a]));

  res.json({
    challenges: challenges.map((c) => {
      const att = attemptMap.get(c.id);
      return { ...c, solved: att?.solved ?? false, attempts: att?.attempts ?? 0 };
    }),
  });
});

const flagSchema = z.object({ flag: z.string().min(1).max(500) });

router.post(
  "/ctf/:key/submit",
  requireAuth("public"),
  ctfSubmitLimiter,
  validate(flagSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { flag } = req.body as z.infer<typeof flagSchema>;
    const key = String(req.params.key);

    const challenge = await prisma.cTFChallenge.findUnique({ where: { challengeKey: key } });
    if (!challenge) throw new NotFoundError("Challenge");

    const existing = await prisma.cTFAttempt.findUnique({
      where: { userId_challengeId: { userId: req.auth!.sub, challengeId: challenge.id } },
    });
    if (existing?.solved) {
      res.json({ correct: true, alreadySolved: true, points: challenge.points });
      return;
    }

    const correct = await bcrypt.compare(flag.trim(), challenge.flagHash);

    const attempt = await prisma.cTFAttempt.upsert({
      where: { userId_challengeId: { userId: req.auth!.sub, challengeId: challenge.id } },
      update: {
        attempts: { increment: 1 },
        solved: correct || (existing?.solved ?? false),
        solvedAt: correct && !existing?.solved ? new Date() : (existing?.solvedAt ?? null),
      },
      create: { userId: req.auth!.sub, challengeId: challenge.id, attempts: 1, solved: correct, solvedAt: correct ? new Date() : null },
    });
    res.json({
      correct,
      attempts: attempt.attempts,
      points: correct ? challenge.points : 0,
      message: correct ? "Correct! Flag accepted." : "Incorrect flag. Try again.",
    });
  }
);

router.get("/progress", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const [totalLessons, completedLessons, totalCTF, solvedCTF] = await Promise.all([
    prisma.securityLesson.count(),
    prisma.userSecurityProgress.count({ where: { userId: req.auth!.sub, status: "completed" } }),
    prisma.cTFChallenge.count(),
    prisma.cTFAttempt.count({ where: { userId: req.auth!.sub, solved: true } }),
  ]);

  const solvedAttempts = await prisma.cTFAttempt.findMany({
    where: { userId: req.auth!.sub, solved: true },
    include: { challenge: { select: { points: true } } },
  });
  res.json({
    lessons: { total: totalLessons, completed: completedLessons },
    ctf: { total: totalCTF, solved: solvedCTF, points: solvedAttempts.reduce((s, a) => s + a.challenge.points, 0) },
  });
});

export const securityLearnRouter = router;
