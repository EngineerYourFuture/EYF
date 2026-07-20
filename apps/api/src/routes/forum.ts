import type { FastifyInstance } from "fastify";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma, ForumCategory, ReactionKind } from "@eyf/db";

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);
}

export async function forumRoutes(app: FastifyInstance) {
  app.get("/threads", async (req) => {
    const { category, q, cursor, limit } = z.object({
      category: z.nativeEnum(ForumCategory).optional(),
      q: z.string().optional(),
      cursor: z.string().optional(),
      limit: z.coerce.number().min(1).max(50).default(20),
    }).parse(req.query);
    const threads = await prisma.forumThread.findMany({
      where: {
        ...(category && { category }),
        ...(q && { OR: [{ title: { contains: q, mode: "insensitive" } }, { body: { contains: q, mode: "insensitive" } }] }),
      },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: [{ pinned: "desc" }, { lastPostAt: "desc" }],
      include: {
        author: { select: { name: true } },
        _count: { select: { posts: true, reactions: true } },
      },
    });
    const next = threads.length > limit ? threads.pop()!.id : null;
    return { success: true, data: threads, meta: { cursor: next } };
  });

  app.get("/threads/:slug", async (req, reply) => {
    const { slug } = z.object({ slug: z.string() }).parse(req.params);
    const thread = await prisma.forumThread.findUnique({
      where: { slug },
      include: {
        author: { select: { name: true } },
        posts: {
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { name: true } },
            _count: { select: { reactions: true } },
          },
        },
        _count: { select: { reactions: true } },
      },
    });
    if (!thread) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Thread not found" } });
    await prisma.forumThread.update({ where: { id: thread.id }, data: { viewCount: { increment: 1 } } });
    return { success: true, data: thread };
  });

  app.post("/threads", { preHandler: app.requireAuth }, async (req) => {
    const body = z.object({
      title: z.string().min(5).max(200),
      body: z.string().min(10).max(20_000),
      category: z.nativeEnum(ForumCategory),
    }).parse(req.body);
    let slug = slugify(body.title);
    // Ensure uniqueness with a short random suffix on collision.
    const collision = await prisma.forumThread.findUnique({ where: { slug } });
    if (collision) slug = `${slug}-${randomBytes(2).toString("hex")}`;
    const thread = await prisma.forumThread.create({
      data: { ...body, slug, authorId: req.session!.id },
    });
    return { success: true, data: thread };
  });

  app.post("/threads/:slug/posts", { preHandler: app.requireAuth }, async (req, reply) => {
    const { slug } = z.object({ slug: z.string() }).parse(req.params);
    const { body, parentId } = z.object({
      body: z.string().min(1).max(20_000),
      parentId: z.string().optional(),
    }).parse(req.body);
    const thread = await prisma.forumThread.findUnique({ where: { slug } });
    if (!thread) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Thread not found" } });
    if (thread.locked) return reply.code(403).send({ success: false, error: { code: "THREAD_LOCKED", message: "Thread is locked." } });
    // A reply's parent must live in the same thread.
    if (parentId) {
      const parent = await prisma.forumPost.findUnique({ where: { id: parentId }, select: { threadId: true } });
      if (parent?.threadId !== thread.id) {
        return reply.code(400).send({ success: false, error: { code: "INVALID_PARENT", message: "Parent post is not in this thread." } });
      }
    }
    const post = await prisma.$transaction(async (tx) => {
      const p = await tx.forumPost.create({
        data: { threadId: thread.id, authorId: req.session!.id, body, parentId },
      });
      await tx.forumThread.update({
        where: { id: thread.id },
        data: { postCount: { increment: 1 }, lastPostAt: new Date() },
      });
      return p;
    });
    return { success: true, data: post };
  });

  app.post("/react", { preHandler: app.requireAuth }, async (req, reply) => {
    const body = z.object({
      kind: z.nativeEnum(ReactionKind),
      threadId: z.string().optional(),
      postId: z.string().optional(),
    }).parse(req.body);
    if (!body.threadId && !body.postId) return reply.code(400).send({ success: false, error: { code: "MISSING_TARGET", message: "Need threadId or postId" } });
    // Toggle behavior: if exists, delete; else create.
    const existing = await prisma.forumReaction.findFirst({
      where: { userId: req.session!.id, kind: body.kind, threadId: body.threadId ?? null, postId: body.postId ?? null },
    });
    if (existing) {
      await prisma.forumReaction.delete({ where: { id: existing.id } });
      return { success: true, data: { reacted: false } };
    }
    await prisma.forumReaction.create({
      data: { userId: req.session!.id, kind: body.kind, threadId: body.threadId, postId: body.postId },
    });
    return { success: true, data: { reacted: true } };
  });
}
