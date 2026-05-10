import { Router, Response } from "express";
import { z } from "zod";
import { Prisma, Plan } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest, asStr } from "../middleware/auth";

const router = Router();

const PLAN_ORDER: Record<string, number> = { free: 0, basic: 1, pro: 2, elite: 3 };

async function checkDailyLimit(userId: string, plan: Plan, today: string): Promise<boolean> {
  const entitlement = await prisma.planEntitlement.findUnique({
    where: { plan_featureKey: { plan, featureKey: "dsa_daily_submissions" } },
  });
  if (entitlement?.limitValue == null) return false;
  const usage = await prisma.dailySubmissionUsage.findUnique({
    where: { userId_date: { userId, date: today } },
  });
  return (usage?.count ?? 0) >= entitlement.limitValue;
}

interface TestCaseResult { passed: boolean; hidden: boolean; }

// GET /problems
router.get("/", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const difficulty = asStr(req.query.difficulty as string | string[]);
  const topic = asStr(req.query.topic as string | string[]);
  const search = asStr(req.query.search as string | string[]);
  const page = Number(asStr(req.query.page as string | string[]) || "1");
  const limit = Number(asStr(req.query.limit as string | string[]) || "30");
  const userPlanLevel = PLAN_ORDER[req.auth!.plan] ?? 0;
  const take = Math.min(limit || 30, 100);
  const skip = (Math.max(page || 1, 1) - 1) * take;

  const where: Prisma.ProblemWhereInput = {};
  if (difficulty) where.difficulty = difficulty as Prisma.EnumDifficultyFilter;
  if (topic) where.topics = { has: topic };
  if (search) where.title = { contains: search, mode: "insensitive" };

  const [problems, total] = await Promise.all([
    prisma.problem.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "asc" },
      select: {
        id: true, slug: true, title: true, difficulty: true,
        topics: true, planAccess: true, createdAt: true,
      },
    }),
    prisma.problem.count({ where }),
  ]);

  const userSubmissions = await prisma.submission.findMany({
    where: { userId: req.auth!.sub, problemId: { in: problems.map((p) => p.id) }, status: "accepted" },
    select: { problemId: true },
  });
  const solvedSet = new Set(userSubmissions.map((s) => s.problemId));

  const enriched = problems.map((p) => ({
    ...p,
    locked: PLAN_ORDER[p.planAccess] > userPlanLevel,
    solved: solvedSet.has(p.id),
  }));

  res.json({ problems: enriched, total, page, limit: take });
});

// GET /problems/:id
router.get("/:id", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const problem = await prisma.problem.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: { testCases: { where: { isHidden: false }, orderBy: { orderIndex: "asc" } } },
  });

  if (!problem) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Problem not found." } });
    return;
  }

  const userPlanLevel = PLAN_ORDER[req.auth!.plan] ?? 0;
  if (PLAN_ORDER[problem.planAccess] > userPlanLevel) {
    res.status(403).json({ error: { code: "PLAN_REQUIRED", message: `Requires ${problem.planAccess} plan.` } });
    return;
  }

  res.json({
    id: problem.id, slug: problem.slug, title: problem.title,
    difficulty: problem.difficulty, topics: problem.topics,
    description: problem.statement, examples: problem.examples,
    constraints: problem.constraints, hints: problem.hints,
    testCases: problem.testCases.map((tc) => ({ input: tc.input, output: tc.expectedOutput })),
  });
});

const RunSchema = z.object({
  code: z.string().min(1).max(50000),
  language: z.enum(["javascript", "python", "java", "cpp", "c"]),
  input: z.string().max(10000).optional(),
});

// POST /problems/:id/run
router.post("/:id/run", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const parse = RunSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: { code: "VALIDATION", message: parse.error.issues[0]?.message } });
    return;
  }

  const id = String(req.params.id);
  const problem = await prisma.problem.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    select: { id: true, planAccess: true },
  });
  if (!problem) { res.status(404).json({ error: { code: "NOT_FOUND", message: "Problem not found." } }); return; }

  const today = new Date().toISOString().slice(0, 10);
  const userId = req.auth!.sub;

  if (await checkDailyLimit(userId, req.auth!.plan as Plan, today)) {
    res.status(429).json({ error: { code: "DAILY_LIMIT", message: "Daily submission limit reached." } });
    return;
  }

  const startMs = Date.now();
  const simulatedResult = simulateExecution(parse.data.code, parse.data.language, parse.data.input ?? "");
  const runtimeMs = Date.now() - startMs + Math.floor(Math.random() * 200);

  const run = await prisma.executionRun.create({
    data: {
      userId, problemId: problem.id, language: parse.data.language,
      sourceCode: parse.data.code, stdout: simulatedResult.stdout,
      stderr: simulatedResult.stderr, exitCode: simulatedResult.exitCode, runtimeMs,
    },
  });

  await prisma.dailySubmissionUsage.upsert({
    where: { userId_date: { userId, date: today } },
    update: { count: { increment: 1 } },
    create: { userId, date: today, count: 1 },
  });

  res.json({ runId: run.id, stdout: simulatedResult.stdout, stderr: simulatedResult.stderr, exitCode: simulatedResult.exitCode, runtimeMs });
});

const SubmitSchema = z.object({
  code: z.string().min(1).max(50000),
  language: z.enum(["javascript", "python", "java", "cpp", "c"]),
});

// POST /problems/:id/submit
router.post("/:id/submit", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const parse = SubmitSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: { code: "VALIDATION", message: parse.error.issues[0]?.message } });
    return;
  }

  const id = String(req.params.id);
  const problem = await prisma.problem.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: { testCases: true },
  });
  if (!problem) { res.status(404).json({ error: { code: "NOT_FOUND", message: "Problem not found." } }); return; }

  const userId = req.auth!.sub;
  const today = new Date().toISOString().slice(0, 10);

  if (await checkDailyLimit(userId, req.auth!.plan as Plan, today)) {
    res.status(429).json({ error: { code: "DAILY_LIMIT", message: "Daily submission limit reached." } });
    return;
  }

  const results: TestCaseResult[] = problem.testCases.map((tc) => {
    const result = simulateExecution(parse.data.code, parse.data.language, tc.input);
    return { passed: result.stdout.trim() === tc.expectedOutput.trim(), hidden: tc.isHidden };
  });

  const allPassed = results.every((r) => r.passed);
  const status = allPassed ? "accepted" : "wrong_answer";

  const submission = await prisma.submission.create({
    data: {
      userId, problemId: problem.id, language: parse.data.language,
      sourceCode: parse.data.code, status,
      runtimeMs: 100 + Math.floor(Math.random() * 400),
      memoryKb: 1024 + Math.floor(Math.random() * 8192),
    },
  });

  await prisma.dailySubmissionUsage.upsert({
    where: { userId_date: { userId, date: today } },
    update: { count: { increment: 1 } },
    create: { userId, date: today, count: 1 },
  });

  if (allPassed) {
    const xpReward = problem.difficulty === "easy" ? 50 : (problem.difficulty === "medium" ? 100 : 200);
    await Promise.all([
      prisma.userXP.upsert({
        where: { userId },
        update: { totalXp: { increment: xpReward }, lastActivityDate: new Date() },
        create: { userId, totalXp: xpReward, lastActivityDate: new Date() },
      }),
      prisma.moduleProgress.upsert({
        where: { userId_moduleKey: { userId, moduleKey: "dsa" } },
        update: { status: "in_progress", lastActivityAt: new Date() },
        create: { userId, moduleKey: "dsa", status: "in_progress" },
      }),
      prisma.recentActivity.create({
        data: { userId, moduleKey: "dsa", action: "problem_solved", payload: { problemId: problem.id, difficulty: problem.difficulty } as Prisma.InputJsonValue },
      }),
    ]);
  }

  const testResults = results
    .filter((r) => !r.hidden)
    .map((r, i) => ({ testCase: i + 1, passed: r.passed }));

  res.json({
    submissionId: submission.id, verdict: status,
    passed: results.filter((r) => r.passed).length,
    total: results.length, testResults,
    runtimeMs: submission.runtimeMs, memoryKb: submission.memoryKb,
  });
});

// GET /problems/:id/submissions
router.get("/:id/submissions", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const submissions = await prisma.submission.findMany({
    where: { userId: req.auth!.sub, problem: { OR: [{ id }, { slug: id }] } },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, language: true, status: true, runtimeMs: true, memoryKb: true, createdAt: true },
  });
  res.json({ submissions });
});

function simulateExecution(code: string, _language: string, input: string): { stdout: string; stderr: string; exitCode: number } {
  if (code.trim().length < 5) return { stdout: "", stderr: "Empty code.", exitCode: 1 };
  return { stdout: input || "output", stderr: "", exitCode: 0 };
}

export { router as problemsRouter };
