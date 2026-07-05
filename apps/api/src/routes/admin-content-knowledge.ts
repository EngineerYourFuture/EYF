/**
 * Admin content — EYF Knowledge Base curation. AI-generated answers land here
 * unreviewed; staff edit/approve/retire them or write entries from scratch.
 * Same CRUD template as the other content verticals (manage:content + gate +
 * audit). Curation is the quality loop that turns AI output into EYF's owned,
 * trusted corpus.
 */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, KnowledgeSource } from "@eyf/db";
import { requirePermission } from "../middleware/permissions.js";
import { recordAudit } from "../lib/audit.js";

const badRequest = (reply: import("fastify").FastifyReply, msg: string) =>
  reply.code(400).send({ success: false, error: { code: "VALIDATION", message: msg } });

const entryInput = z.object({
  question: z.string().trim().min(8).max(300),
  answer: z.string().min(1),
  topic: z.string().min(1).max(40),
  tags: z.array(z.string().min(1).max(30)).max(6).default([]),
  reviewed: z.boolean().default(true),
  active: z.boolean().default(true),
});

export async function adminContentKnowledgeRoutes(app: FastifyInstance) {
  const guard = { preHandler: [app.requireAuth, requirePermission("manage:content")] };

  app.get("/knowledge", guard, async (req) => {
    const { status } = req.query as { status?: string };
    const where =
      status === "unreviewed" ? { reviewed: false } :
      status === "reviewed" ? { reviewed: true } :
      status === "retired" ? { active: false } : {};
    const rows = await prisma.knowledgeEntry.findMany({
      where,
      orderBy: [{ reviewed: "asc" }, { askCount: "desc" }],
      take: 200,
      select: { id: true, question: true, topic: true, tags: true, source: true, reviewed: true, active: true, askCount: true, createdAt: true },
    });
    return { success: true, data: rows };
  });

  app.get("/knowledge/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const row = await prisma.knowledgeEntry.findUnique({ where: { id } });
    if (!row) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Entry not found." } });
    return { success: true, data: row };
  });

  // Staff-authored entry — trusted from birth.
  app.post("/knowledge", guard, async (req, reply) => {
    const parsed = entryInput.safeParse(req.body);
    if (!parsed.success) return badRequest(reply, parsed.error.issues[0]?.message ?? "Invalid input");
    const created = await prisma.knowledgeEntry.create({
      data: { ...parsed.data, source: KnowledgeSource.STAFF },
    });
    await recordAudit(req, { action: "create", entity: "knowledge-entry", entityId: created.id, summary: `Wrote KB answer: "${created.question.slice(0, 60)}"` });
    return reply.code(201).send({ success: true, data: created });
  });

  // Editing an AI entry counts as staff sign-off unless reviewed is explicitly sent.
  app.patch("/knowledge/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = entryInput.partial().safeParse(req.body);
    if (!parsed.success) return badRequest(reply, parsed.error.issues[0]?.message ?? "Invalid input");
    const existing = await prisma.knowledgeEntry.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Entry not found." } });
    const updated = await prisma.knowledgeEntry.update({
      where: { id },
      data: { ...parsed.data, reviewed: parsed.data.reviewed ?? true },
    });
    await recordAudit(req, { action: "update", entity: "knowledge-entry", entityId: id, summary: `Curated KB answer: "${updated.question.slice(0, 60)}"` });
    return { success: true, data: updated };
  });

  app.delete("/knowledge/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.knowledgeEntry.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Entry not found." } });
    await prisma.knowledgeEntry.delete({ where: { id } });
    await recordAudit(req, { action: "delete", entity: "knowledge-entry", entityId: id, summary: "Deleted a KB entry" });
    return { success: true, data: { id } };
  });
}
