import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

const TECH_SKILLS = [
  {
    skillKey: "javascript", category: "frontend", name: "JavaScript",
    tasks: [
      { taskKey: "js-basics", title: "JS Fundamentals", xpReward: 50 },
      { taskKey: "js-async", title: "Async/Await & Promises", xpReward: 75 },
      { taskKey: "js-closures", title: "Closures & Scope", xpReward: 75 },
    ],
  },
  {
    skillKey: "typescript", category: "frontend", name: "TypeScript",
    tasks: [
      { taskKey: "ts-types", title: "Type System Basics", xpReward: 75 },
      { taskKey: "ts-generics", title: "Generics & Utility Types", xpReward: 100 },
    ],
  },
  {
    skillKey: "react", category: "frontend", name: "React",
    tasks: [
      { taskKey: "react-hooks", title: "Hooks Deep Dive", xpReward: 100 },
      { taskKey: "react-state", title: "State Management", xpReward: 100 },
    ],
  },
  {
    skillKey: "nodejs", category: "backend", name: "Node.js",
    tasks: [
      { taskKey: "node-basics", title: "Node.js Core Modules", xpReward: 75 },
      { taskKey: "node-express", title: "REST APIs with Express", xpReward: 100 },
    ],
  },
  {
    skillKey: "postgresql", category: "backend", name: "PostgreSQL",
    tasks: [
      { taskKey: "pg-queries", title: "Advanced Queries", xpReward: 100 },
      { taskKey: "pg-performance", title: "Indexing & Performance", xpReward: 125 },
    ],
  },
  {
    skillKey: "docker", category: "devops", name: "Docker",
    tasks: [
      { taskKey: "docker-basics", title: "Containers & Images", xpReward: 75 },
      { taskKey: "docker-compose", title: "Docker Compose", xpReward: 100 },
    ],
  },
  {
    skillKey: "python", category: "data", name: "Python",
    tasks: [
      { taskKey: "py-basics", title: "Python Core", xpReward: 50 },
      { taskKey: "py-data", title: "Data Processing", xpReward: 100 },
    ],
  },
];

// GET /skills
router.get("/", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.auth!.sub;
  const progress = await prisma.techSkillProgress.findMany({ where: { userId } });
  const attempts = await prisma.techSkillTaskAttempt.findMany({ where: { userId } });

  const progressMap = new Map(progress.map((p) => [p.skillKey, p]));
  const attemptMap = new Map(attempts.map((a) => [a.taskKey, a]));

  const skills = TECH_SKILLS.map((skill) => ({
    ...skill,
    level: progressMap.get(skill.skillKey)?.level ?? 1,
    xp: progressMap.get(skill.skillKey)?.xp ?? 0,
    tasks: skill.tasks.map((task) => ({
      ...task,
      status: attemptMap.get(task.taskKey)?.status ?? "not_started",
    })),
  }));

  res.json({ skills });
});

const TaskAttemptSchema = z.object({
  status: z.enum(["started", "submitted"]),
  evidence: z.string().max(5000).optional(),
});

// POST /skills/:skillKey/tasks/:taskKey
router.post("/:skillKey/tasks/:taskKey", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const parse = TaskAttemptSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: { code: "VALIDATION", message: parse.error.issues[0]?.message } });
    return;
  }

  const skillKey = String(req.params.skillKey);
  const taskKey = String(req.params.taskKey);
  const skill = TECH_SKILLS.find((s) => s.skillKey === skillKey);
  const task = skill?.tasks.find((t) => t.taskKey === taskKey);
  if (!task) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Task not found." } });
    return;
  }

  const userId = req.auth!.sub;
  const attempt = await prisma.techSkillTaskAttempt.upsert({
    where: { userId_taskKey: { userId, taskKey } },
    update: { status: parse.data.status, evidence: parse.data.evidence },
    create: { userId, taskKey, status: parse.data.status, evidence: parse.data.evidence },
  });

  if (parse.data.status === "submitted") {
    await prisma.techSkillProgress.upsert({
      where: { userId_skillKey: { userId, skillKey } },
      update: { xp: { increment: task.xpReward } },
      create: { userId, skillKey, xp: task.xpReward },
    });

    await prisma.userXP.upsert({
      where: { userId },
      update: { totalXp: { increment: task.xpReward } },
      create: { userId, totalXp: task.xpReward },
    });
  }

  res.json({ attempt });
});

export { router as skillsRouter };
