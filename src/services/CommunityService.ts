import { prisma } from "../lib/prisma";
import { NotFoundError, ForbiddenError } from "../lib/AppError";

export class CommunityService {
  async castVote(userId: string, postId: string, vote: 1 | -1): Promise<number> {
    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
      select: { id: true, upvotes: true },
    });
    if (!post) throw new NotFoundError("Post");

    const existing = await prisma.communityVote.findUnique({
      where: { userId_postId: { userId, postId: post.id } },
    });

    let delta: number = vote;

    if (existing) {
      if (existing.vote === vote) {
        // Toggling same vote off
        await prisma.communityVote.delete({
          where: { userId_postId: { userId, postId: post.id } },
        });
        delta = -vote;
      } else {
        // Switching direction
        await prisma.communityVote.update({
          where: { userId_postId: { userId, postId: post.id } },
          data: { vote },
        });
        delta = vote * 2;
      }
    } else {
      await prisma.communityVote.create({
        data: { userId, postId: post.id, vote },
      });
    }

    const updated = await prisma.communityPost.update({
      where: { id: post.id },
      data: { upvotes: { increment: delta } },
      select: { upvotes: true },
    });

    return updated.upvotes;
  }

  async deletePost(userId: string, postId: string, userRole: string): Promise<void> {
    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
      select: { userId: true },
    });
    if (!post) throw new NotFoundError("Post");
    if (post.userId !== userId && userRole === "user") throw new ForbiddenError();
    await prisma.communityPost.delete({ where: { id: postId } });
  }
}

export const communityService = new CommunityService();
