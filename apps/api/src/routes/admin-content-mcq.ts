/**
 * Admin content — MCQ question bank. The 295-line hardcoded TS bank becomes
 * staff-editable content: full CRUD + a one-click idempotent import of the
 * legacy bank as starter content. Once rows exist, the student MCQ engine
 * reads the DB (lib/mcq-source.ts); the TS bank is only a cold-start fallback.
 */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, McqCategory } from "@eyf/db";
import { requirePermission } from "../middleware/permissions.js";
import { recordAudit } from "../lib/audit.js";
import { importLegacyBank } from "../lib/mcq-source.js";

const badRequest = (reply: import("fastify").FastifyReply, msg: string) =>
  reply.code(400).send({ success: false, error: { code: "VALIDATION", message: msg } });

const questionInput = z.object({
  category: z.nativeEnum(McqCategory),
  topic: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  prompt: z.string().min(1),
  choices: z.array(z.string().min(1)).min(2).max(6),
  correctIndex: z.number().int().min(0),
  explanation: z.string().min(1),
  companies: z.array(z.string()).default([]),
  active: z.boolean().default(true),
}).refine((q) => q.correctIndex < q.choices.length, { message: "correctIndex must point at one of the choices" });

const partialInput = z.object({
  category: z.nativeEnum(McqCategory).optional(),
  topic: z.string().min(1).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  prompt: z.string().min(1).optional(),
  choices: z.array(z.string().min(1)).min(2).max(6).optional(),
  correctIndex: z.number().int().min(0).optional(),
  explanation: z.string().min(1).optional(),
  companies: z.array(z.string()).optional(),
  active: z.boolean().optional(),
});

export async function adminContentMcqRoutes(app: FastifyInstance) {
  const guard = { preHandler: [app.requireAuth, requirePermission("manage:content")] };

  app.get("/mcq", guard, async (req) => {
    const { category } = req.query as { category?: string };
    const where = category && (Object.values(McqCategory) as string[]).includes(category)
      ? { category: category as McqCategory } : {};
    const rows = await prisma.mcqBankQuestion.findMany({
      where,
      orderBy: [{ category: "asc" }, { topic: "asc" }, { createdAt: "asc" }],
      select: { id: true, category: true, topic: true, difficulty: true, prompt: true, companies: true, active: true, updatedAt: true },
    });
    return { success: true, data: rows };
  });

  app.get("/mcq/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const row = await prisma.mcqBankQuestion.findUnique({ where: { id } });
    if (!row) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Question not found." } });
    return { success: true, data: row };
  });

  app.post("/mcq", guard, async (req, reply) => {
    const parsed = questionInput.safeParse(req.body);
    if (!parsed.success) return badRequest(reply, parsed.error.issues[0]?.message ?? "Invalid input");
    const created = await prisma.mcqBankQuestion.create({ data: parsed.data });
    await recordAudit(req, { action: "create", entity: "mcq-question", entityId: created.id, summary: `Added MCQ (${created.category} · ${created.topic})` });
    return reply.code(201).send({ success: true, data: created });
  });

  app.patch("/mcq/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = partialInput.safeParse(req.body);
    if (!parsed.success) return badRequest(reply, parsed.error.issues[0]?.message ?? "Invalid input");
    const existing = await prisma.mcqBankQuestion.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Question not found." } });
    const choices = parsed.data.choices ?? existing.choices;
    const correctIndex = parsed.data.correctIndex ?? existing.correctIndex;
    if (correctIndex >= choices.length) return badRequest(reply, "correctIndex must point at one of the choices");
    const updated = await prisma.mcqBankQuestion.update({ where: { id }, data: parsed.data });
    await recordAudit(req, { action: "update", entity: "mcq-question", entityId: id, summary: `Edited MCQ (${updated.category} · ${updated.topic})` });
    return { success: true, data: updated };
  });

  // Attempts persist their own answer snapshots, so deleting a question never
  // corrupts history — delete freely (or toggle `active` to retire quietly).
  app.delete("/mcq/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.mcqBankQuestion.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Question not found." } });
    await prisma.mcqBankQuestion.delete({ where: { id } });
    await recordAudit(req, { action: "delete", entity: "mcq-question", entityId: id, summary: "Deleted an MCQ question" });
    return { success: true, data: { id } };
  });

  // One-click starter content: import the legacy TS bank (idempotent by sourceId).
  app.post("/mcq/import-bank", guard, async (req) => {
    const result = await importLegacyBank();
    await recordAudit(req, { action: "create", entity: "mcq-question", entityId: "bank-import", summary: `Imported legacy MCQ bank (${result.imported} new of ${result.total})` });
    return { success: true, data: result };
  });
}
