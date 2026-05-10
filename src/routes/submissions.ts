import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest, asStr } from "../middleware/auth";

const router = Router();

// GET /submissions
router.get("/", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const page = asStr(req.query.page as string | string[]) || "1";
  const limit = asStr(req.query.limit as string | string[]) || "20";
  const take = Math.min(Number(limit) || 20, 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
  const userId = req.auth!.sub;


  const [submissions, total] = await Promise.all([
    prisma.submission.findMany({
      where: { userId },
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { problem: { select: { id: true, slug: true, title: true, difficulty: true } } },
    }),
    prisma.submission.count({ where: { userId } }),
  ]);

  res.json({ submissions, total, page: Number(page), limit: take });
});

// GET /submissions/:id
router.get("/:id", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const submission = await prisma.submission.findUnique({
    where: { id: String(req.params.id) },
    include: {
      problem: { select: { id: true, slug: true, title: true, difficulty: true } },
      trace: true,
    },
  });

  if (!submission || submission.userId !== req.auth!.sub) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Submission not found." } });
    return;
  }

  res.json({ submission });
});

export { router as submissionsRouter };
