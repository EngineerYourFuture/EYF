/**
 * Admin content — Learn pillar: Core Subjects theory notes + SRS flashcards.
 * Same CRUD template as admin-content.ts: manage:content capability, zod
 * validation, audit-logged, clean 400/404/409. Staff write curriculum here
 * instead of in seed files; it's live on /subjects immediately.
 */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, Subject, Difficulty } from "@eyf/db";
import { requirePermission } from "../middleware/permissions.js";
import { recordAudit } from "../lib/audit.js";

const badRequest = (reply: import("fastify").FastifyReply, msg: string) =>
  reply.code(400).send({ success: false, error: { code: "VALIDATION", message: msg } });

const noteInput = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "lowercase letters, numbers and hyphens only"),
  subject: z.nativeEnum(Subject),
  title: z.string().min(1),
  content: z.string().min(1),
  orderIndex: z.number().int().nonnegative().default(0),
  premium: z.boolean().default(false),
  estMinutes: z.number().int().positive().max(240).default(10),
});

const cardInput = z.object({
  subject: z.nativeEnum(Subject),
  topic: z.string().min(1),
  front: z.string().min(1),
  back: z.string().min(1),
  difficulty: z.nativeEnum(Difficulty).default(Difficulty.MEDIUM),
});

export async function adminContentLearnRoutes(app: FastifyInstance) {
  const guard = { preHandler: [app.requireAuth, requirePermission("manage:content")] };

  // ── Theory notes ───────────────────────────────────────────────────
  app.get("/theory-notes", guard, async () => {
    const notes = await prisma.theoryNote.findMany({
      orderBy: [{ subject: "asc" }, { orderIndex: "asc" }],
      select: { id: true, slug: true, subject: true, title: true, orderIndex: true, premium: true, estMinutes: true, updatedAt: true },
    });
    return { success: true, data: notes };
  });
  app.get("/theory-notes/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const note = await prisma.theoryNote.findUnique({ where: { id } });
    if (!note) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Note not found." } });
    return { success: true, data: note };
  });
  app.post("/theory-notes", guard, async (req, reply) => {
    const parsed = noteInput.safeParse(req.body);
    if (!parsed.success) return badRequest(reply, parsed.error.issues[0]?.message ?? "Invalid input");
    const dupe = await prisma.theoryNote.findUnique({ where: { slug: parsed.data.slug }, select: { id: true } });
    if (dupe) return reply.code(409).send({ success: false, error: { code: "SLUG_TAKEN", message: "A note with that slug already exists." } });
    const created = await prisma.theoryNote.create({ data: parsed.data });
    await recordAudit(req, { action: "create", entity: "theory-note", entityId: created.id, summary: `Created note "${created.title}" (${created.subject})` });
    return reply.code(201).send({ success: true, data: created });
  });
  app.patch("/theory-notes/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = noteInput.partial().safeParse(req.body);
    if (!parsed.success) return badRequest(reply, parsed.error.issues[0]?.message ?? "Invalid input");
    const existing = await prisma.theoryNote.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Note not found." } });
    if (parsed.data.slug) {
      const dupe = await prisma.theoryNote.findFirst({ where: { slug: parsed.data.slug, NOT: { id } }, select: { id: true } });
      if (dupe) return reply.code(409).send({ success: false, error: { code: "SLUG_TAKEN", message: "That slug is taken by another note." } });
    }
    const updated = await prisma.theoryNote.update({ where: { id }, data: parsed.data });
    await recordAudit(req, { action: "update", entity: "theory-note", entityId: id, summary: `Edited note "${updated.title}"` });
    return { success: true, data: updated };
  });
  app.delete("/theory-notes/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.theoryNote.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Note not found." } });
    await prisma.theoryNote.delete({ where: { id } });
    await recordAudit(req, { action: "delete", entity: "theory-note", entityId: id, summary: "Deleted a theory note" });
    return { success: true, data: { id } };
  });

  // ── Flashcards ─────────────────────────────────────────────────────
  app.get("/flashcards", guard, async (req) => {
    const { subject } = req.query as { subject?: string };
    const where = subject && (Object.values(Subject) as string[]).includes(subject) ? { subject: subject as Subject } : {};
    const cards = await prisma.flashcard.findMany({
      where,
      orderBy: [{ subject: "asc" }, { topic: "asc" }, { createdAt: "asc" }],
      select: { id: true, subject: true, topic: true, front: true, difficulty: true, createdAt: true, _count: { select: { reviews: true } } },
    });
    return { success: true, data: cards };
  });
  app.get("/flashcards/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const card = await prisma.flashcard.findUnique({ where: { id } });
    if (!card) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Flashcard not found." } });
    return { success: true, data: card };
  });
  app.post("/flashcards", guard, async (req, reply) => {
    const parsed = cardInput.safeParse(req.body);
    if (!parsed.success) return badRequest(reply, parsed.error.issues[0]?.message ?? "Invalid input");
    const created = await prisma.flashcard.create({ data: parsed.data });
    await recordAudit(req, { action: "create", entity: "flashcard", entityId: created.id, summary: `Created flashcard (${created.subject} · ${created.topic})` });
    return reply.code(201).send({ success: true, data: created });
  });
  app.patch("/flashcards/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = cardInput.partial().safeParse(req.body);
    if (!parsed.success) return badRequest(reply, parsed.error.issues[0]?.message ?? "Invalid input");
    const existing = await prisma.flashcard.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Flashcard not found." } });
    const updated = await prisma.flashcard.update({ where: { id }, data: parsed.data });
    await recordAudit(req, { action: "update", entity: "flashcard", entityId: id, summary: `Edited flashcard (${updated.subject} · ${updated.topic})` });
    return { success: true, data: updated };
  });
  // Deleting a card students have reviewed erases their SRS state for it —
  // edit the card instead. Delete only allowed when review-free.
  app.delete("/flashcards/:id", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.flashcard.findUnique({ where: { id }, select: { _count: { select: { reviews: true } } } });
    if (!existing) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Flashcard not found." } });
    if (existing._count.reviews > 0) {
      return reply.code(409).send({ success: false, error: { code: "HAS_DEPENDENTS", message: "Students have reviewed this card — edit it instead of deleting." } });
    }
    await prisma.flashcard.delete({ where: { id } });
    await recordAudit(req, { action: "delete", entity: "flashcard", entityId: id, summary: "Deleted a flashcard" });
    return { success: true, data: { id } };
  });
}
