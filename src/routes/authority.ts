import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole, AuthRequest, asStr } from "../middleware/auth";

const router = Router();

// All authority routes require authority zone + staff/admin role
const authGuard = [requireAuth("authority"), requireRole("staff", "admin")];
const adminGuard = [requireAuth("authority"), requireRole("admin")];

// GET /authority/stats  (admin dashboard)
router.get("/stats", ...adminGuard, async (_req: AuthRequest, res: Response): Promise<void> => {
  const [totalUsers, totalSubmissions, openTickets, activeSubscriptions] = await Promise.all([
    prisma.user.count(),
    prisma.submission.count(),
    prisma.supportTicket.count({ where: { status: "open" } }),
    prisma.subscription.count({ where: { status: "active" } }),
  ]);

  res.json({ totalUsers, totalSubmissions, openTickets, activeSubscriptions });
});

// GET /authority/users  (admin only)
router.get("/users", ...adminGuard, async (req: AuthRequest, res: Response): Promise<void> => {
  const search = asStr(req.query.search as string | string[]);
  const plan = asStr(req.query.plan as string | string[]);
  const role = asStr(req.query.role as string | string[]);
  const page = asStr(req.query.page as string | string[]) || "1";
  const take = 50;
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const where: Record<string, unknown> = {};
  if (search) where.email = { contains: search, mode: "insensitive" };
  if (plan) where.plan = plan;
  if (role) where.role = role;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, role: true, plan: true, createdAt: true },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ users, total, page: Number(page) });
});

// PATCH /authority/users/:id  (admin only — update role/plan)
router.patch("/users/:id", ...adminGuard, async (req: AuthRequest, res: Response): Promise<void> => {
  const { role, plan } = req.body;
  const validRoles = ["user", "staff", "admin"];
  const validPlans = ["free", "basic", "pro", "elite"];

  if (role && !validRoles.includes(role)) {
    res.status(400).json({ error: { code: "VALIDATION", message: "Invalid role." } });
    return;
  }
  if (plan && !validPlans.includes(plan)) {
    res.status(400).json({ error: { code: "VALIDATION", message: "Invalid plan." } });
    return;
  }

  const userId = String(req.params.id);
  const user = await prisma.user.update({
    where: { id: userId },
    data: { ...(role && { role }), ...(plan && { plan }) },
    select: { id: true, email: true, role: true, plan: true },
  });

  await prisma.auditLog.create({
    data: {
      actorId: req.auth!.sub,
      actorRole: req.auth!.role as never,
      action: "user.update",
      resourceType: "User",
      resourceId: userId,
    },
  });

  res.json({ user });
});

// GET /authority/problems  (staff/admin — problem management)
router.get("/problems", ...authGuard, async (_req: AuthRequest, res: Response): Promise<void> => {
  const problems = await prisma.problem.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, slug: true, title: true, difficulty: true, planAccess: true, topics: true, createdAt: true },
  });
  res.json({ problems });
});

const ProblemCreateSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/),
  difficulty: z.enum(["easy", "medium", "hard"]),
  topics: z.array(z.string()).min(1),
  planAccess: z.enum(["free", "basic", "pro", "elite"]).default("free"),
  statement: z.string().min(50),
  examples: z.array(z.object({ input: z.string(), output: z.string(), explanation: z.string().optional() })).optional(),
  constraints: z.array(z.string()).optional(),
  hints: z.array(z.string()).optional(),
  testCases: z.array(z.object({ input: z.string(), expectedOutput: z.string(), isHidden: z.boolean().default(false), orderIndex: z.number().default(0) })).min(1),
});

// POST /authority/problems
router.post("/problems", ...authGuard, async (req: AuthRequest, res: Response): Promise<void> => {
  const parse = ProblemCreateSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: { code: "VALIDATION", message: parse.error.issues[0]?.message } });
    return;
  }

  const { testCases, examples, constraints, hints, ...problemData } = parse.data;

  const problem = await prisma.problem.create({
    data: {
      ...problemData,
      examples: examples ?? [],
      constraints: constraints ?? [],
      hints: hints ?? [],
      testCases: { createMany: { data: testCases } },
    },
    include: { testCases: true },
  });

  await prisma.auditLog.create({
    data: {
      actorId: req.auth!.sub,
      actorRole: req.auth!.role as never,
      action: "problem.create",
      resourceType: "Problem",
      resourceId: problem.id,
    },
  });

  res.status(201).json({ problem });
});

// PATCH /authority/problems/:id
router.patch("/problems/:id", ...authGuard, async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, difficulty, topics, planAccess, statement, examples, constraints, hints } = req.body;
  const problemId = String(req.params.id);

  const problem = await prisma.problem.update({
    where: { id: problemId },
    data: {
      ...(title && { title }),
      ...(difficulty && { difficulty }),
      ...(topics && { topics }),
      ...(planAccess && { planAccess }),
      ...(statement && { statement }),
      ...(examples && { examples }),
      ...(constraints && { constraints }),
      ...(hints && { hints }),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: req.auth!.sub,
      actorRole: req.auth!.role as never,
      action: "problem.update",
      resourceType: "Problem",
      resourceId: problem.id,
    },
  });

  res.json({ problem });
});

// DELETE /authority/problems/:id  (admin only)
router.delete("/problems/:id", ...adminGuard, async (req: AuthRequest, res: Response): Promise<void> => {
  const delId = String(req.params.id);
  await prisma.problem.delete({ where: { id: delId } });

  await prisma.auditLog.create({
    data: {
      actorId: req.auth!.sub,
      actorRole: req.auth!.role as never,
      action: "problem.delete",
      resourceType: "Problem",
      resourceId: delId,
    },
  });

  res.json({ ok: true });
});

// GET /authority/audit-logs
router.get("/audit-logs", ...adminGuard, async (req: AuthRequest, res: Response): Promise<void> => {
  const page = asStr(req.query.page as string | string[]) || "1";
  const take = 50;
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { actor: { select: { email: true } } },
    }),
    prisma.auditLog.count(),
  ]);

  res.json({ logs, total, page: Number(page) });
});

// GET /authority/entitlements
router.get("/entitlements", ...adminGuard, async (_req: AuthRequest, res: Response): Promise<void> => {
  const entitlements = await prisma.planEntitlement.findMany({ orderBy: [{ plan: "asc" }, { featureKey: "asc" }] });
  res.json({ entitlements });
});

const EntitlementSchema = z.object({
  plan: z.enum(["free", "basic", "pro", "elite"]),
  featureKey: z.string().min(1),
  enabled: z.boolean(),
  limitValue: z.number().nullable(),
});

// PUT /authority/entitlements
router.put("/entitlements", ...adminGuard, async (req: AuthRequest, res: Response): Promise<void> => {
  const parse = EntitlementSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: { code: "VALIDATION", message: parse.error.issues[0]?.message } });
    return;
  }

  const entitlement = await prisma.planEntitlement.upsert({
    where: { plan_featureKey: { plan: parse.data.plan as never, featureKey: parse.data.featureKey } },
    update: { enabled: parse.data.enabled, limitValue: parse.data.limitValue },
    create: parse.data as never,
  });

  res.json({ entitlement });
});

export { router as authorityRouter };
