import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest, asStr } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { voteLimiter } from "../middleware/rateLimiter";
import { NotFoundError } from "../lib/AppError";
import { communityService } from "../services/CommunityService";

const router = Router();

const CATEGORIES = ["general", "dsa", "oop", "security", "system-design", "career"] as const;

const postSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  body: z.string().min(5).max(10000),
  category: z.enum(CATEGORIES).default("general"),
  tags: z.array(z.string().max(30)).max(5).default([]),
  parentId: z.string().uuid().optional(),
});

const voteSchema = z.object({ vote: z.union([z.literal(1), z.literal(-1)]) });

router.get("/posts", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const category = asStr(req.query.category as string | string[] | undefined) || undefined;
  const page = Math.max(1, parseInt(asStr(req.query.page as string | string[] | undefined) || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(asStr(req.query.limit as string | string[] | undefined) || "20", 10)));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { parentId: null };
  if (category && CATEGORIES.includes(category as typeof CATEGORIES[number])) {
    where.category = category;
  }

  const [posts, total] = await Promise.all([
    prisma.communityPost.findMany({
      where,
      orderBy: [{ pinned: "desc" }, { upvotes: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
      include: {
        user: { select: { email: true } },
        _count: { select: { replies: true, votes: true } },
      },
    }),
    prisma.communityPost.count({ where }),
  ]);

  res.json({
    posts: posts.map((p) => ({
      id: p.id, title: p.title, body: p.body.slice(0, 300), category: p.category,
      tags: p.tags, upvotes: p.upvotes, pinned: p.pinned, createdAt: p.createdAt,
      author: p.user.email.split("@")[0], replyCount: p._count.replies,
    })),
    total, page, pages: Math.ceil(total / limit),
  });
});

router.post("/posts", requireAuth("public"), validate(postSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  const data = req.body as z.infer<typeof postSchema>;

  if (data.parentId) {
    const parent = await prisma.communityPost.findUnique({ where: { id: data.parentId }, select: { id: true } });
    if (!parent) throw new NotFoundError("Parent post");
  }

  const post = await prisma.communityPost.create({
    data: { userId: req.auth!.sub, ...data },
    include: { user: { select: { email: true } } },
  });

  res.status(201).json({
    id: post.id, title: post.title, body: post.body, category: post.category,
    tags: post.tags, upvotes: post.upvotes, createdAt: post.createdAt,
    author: post.user.email.split("@")[0],
  });
});

router.get("/posts/:id", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const post = await prisma.communityPost.findUnique({
    where: { id },
    include: {
      user: { select: { email: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { email: true } }, _count: { select: { replies: true } } },
      },
    },
  });
  if (!post) throw new NotFoundError("Post");

  res.json({
    id: post.id, title: post.title, body: post.body, category: post.category,
    tags: post.tags, upvotes: post.upvotes, pinned: post.pinned, createdAt: post.createdAt,
    author: post.user.email.split("@")[0],
    replies: post.replies.map((r) => ({
      id: r.id, body: r.body, upvotes: r.upvotes, createdAt: r.createdAt,
      author: r.user.email.split("@")[0], replyCount: r._count.replies,
    })),
  });
});

router.post(
  "/posts/:id/vote",
  requireAuth("public"),
  voteLimiter,
  validate(voteSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const postId = String(req.params.id);
    const { vote } = req.body as z.infer<typeof voteSchema>;
    const upvotes = await communityService.castVote(req.auth!.sub, postId, vote);
    res.json({ upvotes });
  }
);

export const communityRouter = router;
