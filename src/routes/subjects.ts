import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest, asStr } from "../middleware/auth";

const router = Router();

const SUBJECTS = [
  { key: "os", title: "Operating Systems", icon: "memory", description: "Process management, memory, scheduling, file systems." },
  { key: "dbms", title: "Database Systems", icon: "storage", description: "SQL, normalization, transactions, indexing." },
  { key: "cn", title: "Computer Networks", icon: "lan", description: "TCP/IP, HTTP, DNS, routing, security." },
  { key: "oop", title: "OOP & Design", icon: "schema", description: "SOLID principles, design patterns, UML." },
];

// GET /subjects
router.get("/", requireAuth("public"), async (_req: AuthRequest, res: Response): Promise<void> => {
  const topics = await prisma.coreSubjectContent.findMany({
    select: { subject: true },
  });
  const countMap = new Map<string, number>();
  topics.forEach((t) => countMap.set(t.subject, (countMap.get(t.subject) ?? 0) + 1));

  res.json({
    subjects: SUBJECTS.map((s) => ({ ...s, topicCount: countMap.get(s.key) ?? 0 })),
  });
});

// GET /subjects/:subject
router.get("/:subject", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const subject = String(req.params.subject);
  const subjectMeta = SUBJECTS.find((s) => s.key === subject);
  if (!subjectMeta) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Subject not found." } });
    return;
  }

  const topics = await prisma.coreSubjectContent.findMany({
    where: { subject },
    orderBy: { orderIndex: "asc" },
    select: { id: true, topic: true, slug: true, title: true, planAccess: true, orderIndex: true },
  });

  res.json({ subject: subjectMeta, topics });
});

// GET /subjects/:subject/:topic
router.get("/:subject/:topic", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const subject = String(req.params.subject);
  const topic = String(req.params.topic);

  const content = await prisma.coreSubjectContent.findFirst({
    where: { OR: [{ slug: `${subject}-${topic}` }, { subject, topic }] },
  });

  if (!content) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Topic not found." } });
    return;
  }

  const PLAN_ORDER: Record<string, number> = { free: 0, basic: 1, pro: 2, elite: 3 };
  if (PLAN_ORDER[content.planAccess] > (PLAN_ORDER[req.auth!.plan] ?? 0)) {
    res.status(403).json({ error: { code: "PLAN_REQUIRED", message: `Requires ${content.planAccess} plan.` } });
    return;
  }

  // Track progress
  await prisma.recentActivity.create({
    data: { userId: req.auth!.sub, moduleKey: "core-subjects", action: "topic_viewed", payload: { subject, topic } },
  });

  res.json({ content });
});

export { router as subjectsRouter };
