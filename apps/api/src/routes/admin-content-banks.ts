/**
 * Admin content — the last three editorial banks, now staff-editable:
 * assessment questions, communication drill prompts, company-sim blueprints.
 * Each has full CRUD + a one-click idempotent import of its legacy TS bank.
 * Template identical to admin-content.ts (manage:content + gate + audit).
 */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, CommunicationKind, McqCategory } from "@eyf/db";
import { requirePermission } from "../middleware/permissions.js";
import { recordAudit } from "../lib/audit.js";
import { importLegacyAssessmentBank } from "../lib/assessment-source.js";
import { importLegacyCommunicationBank } from "../lib/communication-source.js";
import { importLegacySims } from "../lib/company-sims-source.js";

const badRequest = (reply: import("fastify").FastifyReply, msg: string) =>
  reply.code(400).send({ success: false, error: { code: "VALIDATION", message: msg } });

const notFound = (reply: import("fastify").FastifyReply, what: string) =>
  reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: `${what} not found.` } });

const assessmentInput = z.object({
  area: z.enum(["dsa", "cs", "aptitude"]),
  topic: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  prompt: z.string().min(1),
  choices: z.array(z.string().min(1)).min(2).max(6),
  correctIndex: z.number().int().min(0),
  explanation: z.string().nullable().optional(),
  active: z.boolean().default(true),
}).refine((q) => q.correctIndex < q.choices.length, { message: "correctIndex must point at one of the choices" });

const promptInput = z.object({
  kind: z.nativeEnum(CommunicationKind),
  question: z.string().min(1),
  tip: z.string().min(1),
  covers: z.array(z.string().min(1)).min(1).max(8),
  active: z.boolean().default(true),
});

const simInput = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "lowercase letters, numbers and hyphens only"),
  company: z.string().min(1),
  label: z.string().min(1),
  blurb: z.string().min(1),
  usedBy: z.string().min(1),
  sections: z.array(z.object({
    name: z.string().min(1),
    category: z.nativeEnum(McqCategory),
    questions: z.number().int().min(1).max(60),
    minutes: z.number().int().min(1).max(120),
  })).min(1).max(8),
  active: z.boolean().default(true),
});

export async function adminContentBanksRoutes(app: FastifyInstance) {
  const guard = { preHandler: [app.requireAuth, requirePermission("manage:content")] };

  // ── Assessment questions ───────────────────────────────────────────
  app.get("/assessment", guard, async (req) => {
    const { area } = req.query as { area?: string };
    const where = area && ["dsa", "cs", "aptitude"].includes(area) ? { area } : {};
    const rows = await prisma.assessmentBankQuestion.findMany({
      where,
      orderBy: [{ area: "asc" }, { topic: "asc" }, { createdAt: "asc" }],
      select: { id: true, area: true, topic: true, difficulty: true, prompt: true, active: true, updatedAt: true },
    });
    return { success: true, data: rows };
  });
  app.get("/assessment/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const row = await prisma.assessmentBankQuestion.findUnique({ where: { id } });
    if (!row) return notFound(reply, "Question");
    return { success: true, data: row };
  });
  app.post("/assessment", guard, async (req, reply) => {
    const parsed = assessmentInput.safeParse(req.body);
    if (!parsed.success) return badRequest(reply, parsed.error.issues[0]?.message ?? "Invalid input");
    const created = await prisma.assessmentBankQuestion.create({ data: parsed.data });
    await recordAudit(req, { action: "create", entity: "assessment-question", entityId: created.id, summary: `Added assessment Q (${created.area} · ${created.topic})` });
    return reply.code(201).send({ success: true, data: created });
  });
  app.patch("/assessment/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = assessmentInput.innerType().partial().safeParse(req.body);
    if (!parsed.success) return badRequest(reply, parsed.error.issues[0]?.message ?? "Invalid input");
    const existing = await prisma.assessmentBankQuestion.findUnique({ where: { id } });
    if (!existing) return notFound(reply, "Question");
    const choices = parsed.data.choices ?? existing.choices;
    const correctIndex = parsed.data.correctIndex ?? existing.correctIndex;
    if (correctIndex >= choices.length) return badRequest(reply, "correctIndex must point at one of the choices");
    const updated = await prisma.assessmentBankQuestion.update({ where: { id }, data: parsed.data });
    await recordAudit(req, { action: "update", entity: "assessment-question", entityId: id, summary: `Edited assessment Q (${updated.area} · ${updated.topic})` });
    return { success: true, data: updated };
  });
  app.delete("/assessment/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.assessmentBankQuestion.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return notFound(reply, "Question");
    await prisma.assessmentBankQuestion.delete({ where: { id } });
    await recordAudit(req, { action: "delete", entity: "assessment-question", entityId: id, summary: "Deleted an assessment question" });
    return { success: true, data: { id } };
  });
  app.post("/assessment/import-bank", guard, async (req) => {
    const result = await importLegacyAssessmentBank();
    await recordAudit(req, { action: "create", entity: "assessment-question", entityId: "bank-import", summary: `Imported legacy assessment bank (${result.imported} new of ${result.total})` });
    return { success: true, data: result };
  });

  // ── Communication prompts ──────────────────────────────────────────
  app.get("/communication", guard, async (req) => {
    const { kind } = req.query as { kind?: string };
    const where = kind && (Object.values(CommunicationKind) as string[]).includes(kind) ? { kind: kind as CommunicationKind } : {};
    const rows = await prisma.communicationPromptBank.findMany({
      where,
      orderBy: [{ kind: "asc" }, { createdAt: "asc" }],
      select: { id: true, kind: true, question: true, tip: true, active: true, updatedAt: true },
    });
    return { success: true, data: rows };
  });
  app.get("/communication/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const row = await prisma.communicationPromptBank.findUnique({ where: { id } });
    if (!row) return notFound(reply, "Prompt");
    return { success: true, data: row };
  });
  app.post("/communication", guard, async (req, reply) => {
    const parsed = promptInput.safeParse(req.body);
    if (!parsed.success) return badRequest(reply, parsed.error.issues[0]?.message ?? "Invalid input");
    const created = await prisma.communicationPromptBank.create({ data: parsed.data });
    await recordAudit(req, { action: "create", entity: "communication-prompt", entityId: created.id, summary: `Added drill prompt (${created.kind})` });
    return reply.code(201).send({ success: true, data: created });
  });
  app.patch("/communication/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = promptInput.partial().safeParse(req.body);
    if (!parsed.success) return badRequest(reply, parsed.error.issues[0]?.message ?? "Invalid input");
    const existing = await prisma.communicationPromptBank.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return notFound(reply, "Prompt");
    const updated = await prisma.communicationPromptBank.update({ where: { id }, data: parsed.data });
    await recordAudit(req, { action: "update", entity: "communication-prompt", entityId: id, summary: `Edited drill prompt (${updated.kind})` });
    return { success: true, data: updated };
  });
  app.delete("/communication/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.communicationPromptBank.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return notFound(reply, "Prompt");
    await prisma.communicationPromptBank.delete({ where: { id } });
    await recordAudit(req, { action: "delete", entity: "communication-prompt", entityId: id, summary: "Deleted a drill prompt" });
    return { success: true, data: { id } };
  });
  app.post("/communication/import-bank", guard, async (req) => {
    const result = await importLegacyCommunicationBank();
    await recordAudit(req, { action: "create", entity: "communication-prompt", entityId: "bank-import", summary: `Imported legacy drill prompts (${result.imported} new of ${result.total})` });
    return { success: true, data: result };
  });

  // ── Company-sim blueprints ─────────────────────────────────────────
  app.get("/sims", guard, async () => {
    const rows = await prisma.companySimBlueprint.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, slug: true, company: true, label: true, usedBy: true, sections: true, active: true, updatedAt: true },
    });
    return { success: true, data: rows };
  });
  app.get("/sims/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const row = await prisma.companySimBlueprint.findUnique({ where: { id } });
    if (!row) return notFound(reply, "Sim");
    return { success: true, data: row };
  });
  app.post("/sims", guard, async (req, reply) => {
    const parsed = simInput.safeParse(req.body);
    if (!parsed.success) return badRequest(reply, parsed.error.issues[0]?.message ?? "Invalid input");
    const dupe = await prisma.companySimBlueprint.findUnique({ where: { slug: parsed.data.slug }, select: { id: true } });
    if (dupe) return reply.code(409).send({ success: false, error: { code: "SLUG_TAKEN", message: "A sim with that slug already exists." } });
    const created = await prisma.companySimBlueprint.create({ data: parsed.data });
    await recordAudit(req, { action: "create", entity: "company-sim", entityId: created.id, summary: `Added sim blueprint "${created.label}"` });
    return reply.code(201).send({ success: true, data: created });
  });
  app.patch("/sims/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = simInput.partial().safeParse(req.body);
    if (!parsed.success) return badRequest(reply, parsed.error.issues[0]?.message ?? "Invalid input");
    const existing = await prisma.companySimBlueprint.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return notFound(reply, "Sim");
    if (parsed.data.slug) {
      const dupe = await prisma.companySimBlueprint.findFirst({ where: { slug: parsed.data.slug, NOT: { id } }, select: { id: true } });
      if (dupe) return reply.code(409).send({ success: false, error: { code: "SLUG_TAKEN", message: "That slug is taken by another sim." } });
    }
    const updated = await prisma.companySimBlueprint.update({ where: { id }, data: parsed.data });
    await recordAudit(req, { action: "update", entity: "company-sim", entityId: id, summary: `Edited sim blueprint "${updated.label}"` });
    return { success: true, data: updated };
  });
  app.delete("/sims/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.companySimBlueprint.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return notFound(reply, "Sim");
    await prisma.companySimBlueprint.delete({ where: { id } });
    await recordAudit(req, { action: "delete", entity: "company-sim", entityId: id, summary: "Deleted a sim blueprint" });
    return { success: true, data: { id } };
  });
  app.post("/sims/import-defaults", guard, async (req) => {
    const result = await importLegacySims();
    await recordAudit(req, { action: "create", entity: "company-sim", entityId: "defaults-import", summary: `Imported default sims (${result.imported} new of ${result.total})` });
    return { success: true, data: result };
  });
}
