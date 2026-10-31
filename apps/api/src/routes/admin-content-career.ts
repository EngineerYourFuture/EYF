/**
 * Admin content — Career pillar: internship board + BTech project-idea catalog.
 * Same CRUD template as admin-content.ts: manage:content capability, zod
 * validation, audit-logged, clean 400/404/409. The internship board doubles as
 * the supply side of the LMS ↔ internship flywheel — slots land here.
 */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, InternshipDuration, Difficulty } from "@eyf/db";
import { requirePermission } from "../middleware/permissions.js";
import { recordAudit } from "../lib/audit.js";

const badRequest = (reply: import("fastify").FastifyReply, msg: string) =>
  reply.code(400).send({ success: false, error: { code: "VALIDATION", message: msg } });

const internshipInput = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "lowercase letters, numbers and hyphens only"),
  company: z.string().min(1),
  role: z.string().min(1),
  duration: z.nativeEnum(InternshipDuration).default(InternshipDuration.MONTHS_3),
  stipendInr: z.number().int().nonnegative(),
  location: z.string().min(1),
  remote: z.boolean().default(false),
  description: z.string().min(1),
  applyUrl: z.string().url(),
  eligibility: z.string().nullable().optional(),
  ppoConversion: z.number().min(0).max(100).nullable().optional(),
  deadlineAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().default(true),
});

const ideaInput = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "lowercase letters, numbers and hyphens only"),
  title: z.string().min(1),
  description: z.string().min(1),
  techStack: z.array(z.string()).default([]),
  difficulty: z.nativeEnum(Difficulty).default(Difficulty.MEDIUM),
  weeks: z.number().int().positive().max(52).default(4),
  tags: z.array(z.string()).default([]),
  outcomes: z.array(z.string()).default([]),
  premium: z.boolean().default(false),
});

export async function adminContentCareerRoutes(app: FastifyInstance) {
  const guard = { preHandler: [app.requireAuth, requirePermission("manage:content")] };

  // ── Internships ────────────────────────────────────────────────────
  app.get("/internships", guard, async () => {
    const rows = await prisma.internship.findMany({
      orderBy: { postedAt: "desc" },
      select: {
        id: true, slug: true, company: true, role: true, duration: true, stipendInr: true,
        location: true, remote: true, isActive: true, deadlineAt: true, postedAt: true,
        _count: { select: { applications: true } },
      },
    });
    return { success: true, data: rows };
  });
  app.get("/internships/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const row = await prisma.internship.findUnique({ where: { id } });
    if (!row) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Internship not found." } });
    return { success: true, data: row };
  });
  app.post("/internships", guard, async (req, reply) => {
    const parsed = internshipInput.safeParse(req.body);
    if (!parsed.success) return badRequest(reply, parsed.error.issues[0]?.message ?? "Invalid input");
    const dupe = await prisma.internship.findUnique({ where: { slug: parsed.data.slug }, select: { id: true } });
    if (dupe) return reply.code(409).send({ success: false, error: { code: "SLUG_TAKEN", message: "An internship with that slug already exists." } });
    const created = await prisma.internship.create({ data: parsed.data });
    await recordAudit(req, { action: "create", entity: "internship", entityId: created.id, summary: `Created internship "${created.role}" @ ${created.company}` });
    return reply.code(201).send({ success: true, data: created });
  });
  app.patch("/internships/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = internshipInput.partial().safeParse(req.body);
    if (!parsed.success) return badRequest(reply, parsed.error.issues[0]?.message ?? "Invalid input");
    const existing = await prisma.internship.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Internship not found." } });
    if (parsed.data.slug) {
      const dupe = await prisma.internship.findFirst({ where: { slug: parsed.data.slug, NOT: { id } }, select: { id: true } });
      if (dupe) return reply.code(409).send({ success: false, error: { code: "SLUG_TAKEN", message: "That slug is taken by another internship." } });
    }
    const updated = await prisma.internship.update({ where: { id }, data: parsed.data });
    await recordAudit(req, { action: "update", entity: "internship", entityId: id, summary: `Edited internship "${updated.role}" @ ${updated.company}` });
    return { success: true, data: updated };
  });
  app.delete("/internships/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.internship.findUnique({ where: { id }, select: { _count: { select: { applications: true } } } });
    if (!existing) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Internship not found." } });
    if (existing._count.applications > 0) {
      return reply.code(409).send({ success: false, error: { code: "HAS_DEPENDENTS", message: "Students have applied. Set inactive instead of deleting." } });
    }
    await prisma.internship.delete({ where: { id } });
    await recordAudit(req, { action: "delete", entity: "internship", entityId: id, summary: "Deleted an internship" });
    return { success: true, data: { id } };
  });

  // ── Project ideas ──────────────────────────────────────────────────
  app.get("/project-ideas", guard, async () => {
    const rows = await prisma.projectIdea.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, slug: true, title: true, difficulty: true, weeks: true, premium: true,
        techStack: true, createdAt: true, _count: { select: { userProjects: true } },
      },
    });
    return { success: true, data: rows };
  });
  app.get("/project-ideas/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const row = await prisma.projectIdea.findUnique({ where: { id } });
    if (!row) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Project idea not found." } });
    return { success: true, data: row };
  });
  app.post("/project-ideas", guard, async (req, reply) => {
    const parsed = ideaInput.safeParse(req.body);
    if (!parsed.success) return badRequest(reply, parsed.error.issues[0]?.message ?? "Invalid input");
    const dupe = await prisma.projectIdea.findUnique({ where: { slug: parsed.data.slug }, select: { id: true } });
    if (dupe) return reply.code(409).send({ success: false, error: { code: "SLUG_TAKEN", message: "A project idea with that slug already exists." } });
    const created = await prisma.projectIdea.create({ data: parsed.data });
    await recordAudit(req, { action: "create", entity: "project-idea", entityId: created.id, summary: `Created project idea "${created.title}"` });
    return reply.code(201).send({ success: true, data: created });
  });
  app.patch("/project-ideas/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = ideaInput.partial().safeParse(req.body);
    if (!parsed.success) return badRequest(reply, parsed.error.issues[0]?.message ?? "Invalid input");
    const existing = await prisma.projectIdea.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Project idea not found." } });
    if (parsed.data.slug) {
      const dupe = await prisma.projectIdea.findFirst({ where: { slug: parsed.data.slug, NOT: { id } }, select: { id: true } });
      if (dupe) return reply.code(409).send({ success: false, error: { code: "SLUG_TAKEN", message: "That slug is taken by another project idea." } });
    }
    const updated = await prisma.projectIdea.update({ where: { id }, data: parsed.data });
    await recordAudit(req, { action: "update", entity: "project-idea", entityId: id, summary: `Edited project idea "${updated.title}"` });
    return { success: true, data: updated };
  });
  app.delete("/project-ideas/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.projectIdea.findUnique({ where: { id }, select: { _count: { select: { userProjects: true } } } });
    if (!existing) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Project idea not found." } });
    if (existing._count.userProjects > 0) {
      return reply.code(409).send({ success: false, error: { code: "HAS_DEPENDENTS", message: "Students have started this project. Mark premium/hidden instead of deleting." } });
    }
    await prisma.projectIdea.delete({ where: { id } });
    await recordAudit(req, { action: "delete", entity: "project-idea", entityId: id, summary: "Deleted a project idea" });
    return { success: true, data: { id } };
  });
}
