/**
 * Admin content management — CRUD for the content that used to be hard-coded in
 * seeds. This is the TEMPLATE every other content type (subjects, jobs,
 * companies, tracks) follows: capability-gated (manage:content), zod-validated,
 * clean 400/404/409 errors. Staff edit content here instead of in code.
 */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, Difficulty, JobRole, DemandLevel, InterviewOutcome } from "@eyf/db";
import { requirePermission } from "../middleware/permissions.js";
import { recordAudit } from "../lib/audit.js";

const problemInput = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "lowercase letters, numbers and hyphens only"),
  title: z.string().min(1),
  description: z.string().min(1),
  difficulty: z.nativeEnum(Difficulty),
  topics: z.array(z.string()).default([]),
  patterns: z.array(z.string()).default([]),
  companies: z.array(z.string()).default([]),
  premium: z.boolean().default(false),
  timeLimitMs: z.number().int().positive().max(60_000).default(2000),
  memoryLimitKb: z.number().int().positive().default(262144),
});

const badRequest = (reply: import("fastify").FastifyReply, msg: string) =>
  reply.code(400).send({ success: false, error: { code: "VALIDATION", message: msg } });

export async function adminContentRoutes(app: FastifyInstance) {
  const canManage = requirePermission("manage:content");
  const guard = { preHandler: [app.requireAuth, canManage] };

  // List — lightweight table view.
  app.get("/problems", guard, async () => {
    const problems = await prisma.problem.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true, slug: true, title: true, difficulty: true, premium: true,
        topics: true, patterns: true, companies: true, acceptanceRate: true,
        totalSubmissions: true, updatedAt: true,
      },
    });
    return { success: true, data: problems };
  });

  // Single — full record for the edit form.
  app.get("/problems/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const problem = await prisma.problem.findUnique({ where: { id } });
    if (!problem) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Problem not found." } });
    return { success: true, data: problem };
  });

  // Create.
  app.post("/problems", guard, async (req, reply) => {
    const parsed = problemInput.safeParse(req.body);
    if (!parsed.success) return badRequest(reply, parsed.error.issues[0]?.message ?? "Invalid input");
    const dupe = await prisma.problem.findUnique({ where: { slug: parsed.data.slug }, select: { id: true } });
    if (dupe) return reply.code(409).send({ success: false, error: { code: "SLUG_TAKEN", message: "A problem with that slug already exists." } });
    const created = await prisma.problem.create({ data: parsed.data });
    await recordAudit(req, { action: "create", entity: "problem", entityId: created.id, summary: `Created "${created.title}"` });
    return reply.code(201).send({ success: true, data: created });
  });

  // Update (partial).
  app.patch("/problems/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = problemInput.partial().safeParse(req.body);
    if (!parsed.success) return badRequest(reply, parsed.error.issues[0]?.message ?? "Invalid input");
    const existing = await prisma.problem.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Problem not found." } });
    if (parsed.data.slug) {
      const dupe = await prisma.problem.findFirst({ where: { slug: parsed.data.slug, NOT: { id } }, select: { id: true } });
      if (dupe) return reply.code(409).send({ success: false, error: { code: "SLUG_TAKEN", message: "That slug is taken by another problem." } });
    }
    const updated = await prisma.problem.update({ where: { id }, data: parsed.data });
    await recordAudit(req, { action: "update", entity: "problem", entityId: id, summary: `Edited "${updated.title}"` });
    return { success: true, data: updated };
  });

  // Delete — refuse if students have submissions against it (data integrity).
  app.delete("/problems/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.problem.findUnique({ where: { id }, select: { _count: { select: { solutions: true } } } });
    if (!existing) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Problem not found." } });
    if (existing._count.solutions > 0) {
      return reply.code(409).send({ success: false, error: { code: "HAS_DEPENDENTS", message: "Students have submitted to this problem. Unpublish instead of deleting." } });
    }
    await prisma.problem.delete({ where: { id } });
    await recordAudit(req, { action: "delete", entity: "problem", entityId: id, summary: "Deleted a problem" });
    return { success: true, data: { id } };
  });

  // ── Jobs ───────────────────────────────────────────────────────────
  const jobInput = z.object({
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
    company: z.string().min(1),
    title: z.string().min(1),
    role: z.nativeEnum(JobRole),
    location: z.string().min(1),
    remote: z.boolean().default(false),
    salaryMinInr: z.number().int().nonnegative().nullable().optional(),
    salaryMaxInr: z.number().int().nonnegative().nullable().optional(),
    experienceMin: z.number().int().nonnegative().default(0),
    description: z.string().min(1),
    applyUrl: z.string().url(),
    isActive: z.boolean().default(true),
  });

  app.get("/jobs", guard, async () => {
    const jobs = await prisma.job.findMany({
      orderBy: { postedAt: "desc" },
      select: { id: true, slug: true, company: true, title: true, role: true, location: true, remote: true, isActive: true, postedAt: true },
    });
    return { success: true, data: jobs };
  });
  app.get("/jobs/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Job not found." } });
    return { success: true, data: job };
  });
  app.post("/jobs", guard, async (req, reply) => {
    const parsed = jobInput.safeParse(req.body);
    if (!parsed.success) return badRequest(reply, parsed.error.issues[0]?.message ?? "Invalid input");
    const dupe = await prisma.job.findUnique({ where: { slug: parsed.data.slug }, select: { id: true } });
    if (dupe) return reply.code(409).send({ success: false, error: { code: "SLUG_TAKEN", message: "A job with that slug already exists." } });
    const created = await prisma.job.create({ data: parsed.data });
    await recordAudit(req, { action: "create", entity: "job", entityId: created.id, summary: `Created job "${created.title}" @ ${created.company}` });
    return reply.code(201).send({ success: true, data: created });
  });
  app.patch("/jobs/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = jobInput.partial().safeParse(req.body);
    if (!parsed.success) return badRequest(reply, parsed.error.issues[0]?.message ?? "Invalid input");
    const existing = await prisma.job.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Job not found." } });
    const updated = await prisma.job.update({ where: { id }, data: parsed.data });
    await recordAudit(req, { action: "update", entity: "job", entityId: id, summary: `Edited job "${updated.title}"` });
    return { success: true, data: updated };
  });
  app.delete("/jobs/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.job.findUnique({ where: { id }, select: { _count: { select: { applications: true } } } });
    if (!existing) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Job not found." } });
    if (existing._count.applications > 0) {
      return reply.code(409).send({ success: false, error: { code: "HAS_DEPENDENTS", message: "Students have applied. Set inactive instead of deleting." } });
    }
    await prisma.job.delete({ where: { id } });
    await recordAudit(req, { action: "delete", entity: "job", entityId: id, summary: "Deleted a job" });
    return { success: true, data: { id } };
  });

  // ── Career tracks ──────────────────────────────────────────────────
  const trackInput = z.object({
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
    name: z.string().min(1),
    tagline: z.string().min(1),
    description: z.string().min(1),
    icon: z.string().default("rocket"),
    salaryMinInr: z.number().int().nonnegative(),
    salaryMaxInr: z.number().int().nonnegative(),
    demand: z.nativeEnum(DemandLevel),
    weeks: z.number().int().positive().default(12),
    patterns: z.array(z.string()).default([]),
    topics: z.array(z.string()).default([]),
    companies: z.array(z.string()).default([]),
    curriculum: z.any().default([]),
    premium: z.boolean().default(false),
  });

  app.get("/career-tracks", guard, async () => {
    const tracks = await prisma.careerTrack.findMany({
      orderBy: { name: "asc" },
      select: { id: true, slug: true, name: true, tagline: true, demand: true, weeks: true, premium: true },
    });
    return { success: true, data: tracks };
  });
  app.get("/career-tracks/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const track = await prisma.careerTrack.findUnique({ where: { id } });
    if (!track) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Track not found." } });
    return { success: true, data: track };
  });
  app.post("/career-tracks", guard, async (req, reply) => {
    const parsed = trackInput.safeParse(req.body);
    if (!parsed.success) return badRequest(reply, parsed.error.issues[0]?.message ?? "Invalid input");
    const dupe = await prisma.careerTrack.findUnique({ where: { slug: parsed.data.slug }, select: { id: true } });
    if (dupe) return reply.code(409).send({ success: false, error: { code: "SLUG_TAKEN", message: "A track with that slug already exists." } });
    const { curriculum, ...rest } = parsed.data;
    const created = await prisma.careerTrack.create({ data: { ...rest, curriculum: curriculum ?? [] } });
    await recordAudit(req, { action: "create", entity: "career-track", entityId: created.id, summary: `Created track "${created.name}"` });
    return reply.code(201).send({ success: true, data: created });
  });
  app.patch("/career-tracks/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = trackInput.partial().safeParse(req.body);
    if (!parsed.success) return badRequest(reply, parsed.error.issues[0]?.message ?? "Invalid input");
    const existing = await prisma.careerTrack.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Track not found." } });
    const updated = await prisma.careerTrack.update({ where: { id }, data: parsed.data });
    await recordAudit(req, { action: "update", entity: "career-track", entityId: id, summary: `Edited track "${updated.name}"` });
    return { success: true, data: updated };
  });
  app.delete("/career-tracks/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.careerTrack.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Track not found." } });
    await prisma.careerTrack.delete({ where: { id } });
    await recordAudit(req, { action: "delete", entity: "career-track", entityId: id, summary: "Deleted a career track" });
    return { success: true, data: { id } };
  });

  // ── Interview experiences ──────────────────────────────────────────
  // Staff-curated round-by-round writeups. Created rows are attributed to the
  // staff member and surface on the student /experiences feed immediately —
  // this is how the feed gets seeded and moderated without touching code.
  const experienceInput = z.object({
    company: z.string().min(1),
    role: z.string().min(1),
    outcome: z.nativeEnum(InterviewOutcome).default(InterviewOutcome.OFFER),
    difficulty: z.number().int().min(1).max(5).default(3),
    rounds: z.number().int().min(1).max(15).default(1),
    body: z.string().min(1),
    tips: z.string().nullable().optional(),
  });

  app.get("/experiences", guard, async () => {
    const rows = await prisma.interviewExperience.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, company: true, role: true, outcome: true, difficulty: true,
        rounds: true, upvotes: true, createdAt: true,
        author: { select: { name: true } },
      },
    });
    return { success: true, data: rows };
  });
  app.get("/experiences/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const row = await prisma.interviewExperience.findUnique({ where: { id } });
    if (!row) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Experience not found." } });
    return { success: true, data: row };
  });
  app.post("/experiences", guard, async (req, reply) => {
    const parsed = experienceInput.safeParse(req.body);
    if (!parsed.success) return badRequest(reply, parsed.error.issues[0]?.message ?? "Invalid input");
    const created = await prisma.interviewExperience.create({
      data: { ...parsed.data, authorId: req.session!.id },
    });
    await recordAudit(req, { action: "create", entity: "experience", entityId: created.id, summary: `Added experience: ${created.company} · ${created.role}` });
    return reply.code(201).send({ success: true, data: created });
  });
  app.patch("/experiences/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = experienceInput.partial().safeParse(req.body);
    if (!parsed.success) return badRequest(reply, parsed.error.issues[0]?.message ?? "Invalid input");
    const existing = await prisma.interviewExperience.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Experience not found." } });
    const updated = await prisma.interviewExperience.update({ where: { id }, data: parsed.data });
    await recordAudit(req, { action: "update", entity: "experience", entityId: id, summary: `Edited experience: ${updated.company} · ${updated.role}` });
    return { success: true, data: updated };
  });
  app.delete("/experiences/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.interviewExperience.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Experience not found." } });
    await prisma.interviewExperience.delete({ where: { id } });
    await recordAudit(req, { action: "delete", entity: "experience", entityId: id, summary: "Deleted an interview experience" });
    return { success: true, data: { id } };
  });
}
