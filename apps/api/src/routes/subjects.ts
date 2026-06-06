import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, Subject } from "@eyf/db";
import { nextReview } from "../services/srs.js";

export async function subjectRoutes(app: FastifyInstance) {
  app.get("/", async () => ({
    success: true,
    data: [
      { id: Subject.OS,   name: "Operating Systems",       free: true },
      { id: Subject.DBMS, name: "Database Management",     free: false },
      { id: Subject.CN,   name: "Computer Networks",       free: false },
      { id: Subject.OOP,  name: "Object-Oriented Programming", free: false },
    ],
  }));

  app.get("/:subject/notes", async (req, reply) => {
    const params = z.object({ subject: z.nativeEnum(Subject) }).parse(req.params);
    const notes = await prisma.theoryNote.findMany({
      where: { subject: params.subject },
      orderBy: { orderIndex: "asc" },
      select: { id: true, slug: true, subject: true, title: true, premium: true, estMinutes: true },
    });
    void reply;
    return { success: true, data: notes };
  });

  app.get(
    "/notes/:slug",
    { preHandler: app.requireAuth },
    async (req, reply) => {
      const { slug } = z.object({ slug: z.string() }).parse(req.params);
      const note = await prisma.theoryNote.findUnique({ where: { slug } });
      if (!note) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Note not found." } });
      if (note.premium && req.session!.plan === "free") {
        return reply.code(402).send({
          success: false,
          error: { code: "PLAN_UPGRADE_REQUIRED", message: "Upgrade to Basic for full theory access.", upgradeRequired: true, plan: "basic" },
        });
      }
      return { success: true, data: note };
    },
  );

  // Flashcards — due today + count.
  app.get("/:subject/flashcards/due", { preHandler: app.requireAuth }, async (req) => {
    const { subject } = z.object({ subject: z.nativeEnum(Subject) }).parse(req.params);
    const due = await prisma.flashcard.findMany({
      where: {
        subject,
        OR: [
          { reviews: { some: { userId: req.session!.id, dueAt: { lte: new Date() } } } },
          { reviews: { none: { userId: req.session!.id } } }, // new cards
        ],
      },
      take: 25,
      include: { reviews: { where: { userId: req.session!.id }, take: 1 } },
    });
    return {
      success: true,
      data: due.map((f) => ({
        id: f.id, subject: f.subject, topic: f.topic, front: f.front,
        // back is sent only after self-grade; for now we ship it (UI hides until reveal)
        back: f.back,
        srs: f.reviews[0] ?? null,
      })),
    };
  });

  app.post("/flashcards/:id/review", { preHandler: app.requireAuth }, async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const { quality } = z.object({ quality: z.number().int().min(0).max(5) }).parse(req.body);
    const existing = await prisma.flashcardReview.findUnique({
      where: { userId_flashcardId: { userId: req.session!.id, flashcardId: id } },
    });
    const prev = existing ?? { easiness: 2.5, interval: 0, repetitions: 0 };
    const next = nextReview(prev, quality as 0 | 1 | 2 | 3 | 4 | 5);
    const updated = await prisma.flashcardReview.upsert({
      where: { userId_flashcardId: { userId: req.session!.id, flashcardId: id } },
      create: { userId: req.session!.id, flashcardId: id, ...next, lastReviewedAt: new Date() },
      update: { ...next, lastReviewedAt: new Date() },
    });
    void reply;
    return { success: true, data: updated };
  });
}
