/**
 * Peer mock matchmaking — simplest possible: FIFO across users waiting.
 * If two users in queue share a problemFocus, prefer them; otherwise just
 * pair the two oldest waiters.
 */
import { prisma, MockType, MockStatus, PeerQueueStatus } from "@eyf/db";

export async function joinOrMatch(input: {
  userId: string;
  problemFocus?: string;
}): Promise<{ matched: true; mockSessionId: string } | { matched: false; queuePosition: number }> {
  // Look for an existing waiter (not self) with same focus first.
  const sameFocus = input.problemFocus
    ? await prisma.peerQueue.findFirst({
        where: {
          status: PeerQueueStatus.WAITING,
          NOT: { userId: input.userId },
          problemFocus: input.problemFocus,
        },
        orderBy: { joinedAt: "asc" },
      })
    : null;
  const anyWaiter = sameFocus ?? await prisma.peerQueue.findFirst({
    where: { status: PeerQueueStatus.WAITING, NOT: { userId: input.userId } },
    orderBy: { joinedAt: "asc" },
  });

  if (anyWaiter) {
    // Pair them — atomically create mock + mark both queue rows MATCHED.
    return await prisma.$transaction(async (tx) => {
      const mock = await tx.mockSession.create({
        data: {
          type: MockType.PEER,
          status: MockStatus.IN_PROGRESS,
          candidateId: input.userId,
          peerId: anyWaiter.userId,
          scheduledFor: new Date(),
          startedAt: new Date(),
          problemFocus: input.problemFocus ?? anyWaiter.problemFocus ?? null,
        },
      });
      await tx.peerQueue.update({
        where: { id: anyWaiter.id },
        data: { status: PeerQueueStatus.MATCHED, matchedMockId: mock.id },
      });
      // Upsert self into matched state too — so polling sees the match.
      await tx.peerQueue.upsert({
        where: { userId: input.userId },
        create: {
          userId: input.userId, status: PeerQueueStatus.MATCHED,
          problemFocus: input.problemFocus, matchedMockId: mock.id,
        },
        update: { status: PeerQueueStatus.MATCHED, matchedMockId: mock.id },
      });
      return { matched: true as const, mockSessionId: mock.id };
    });
  }

  // No partner — join the queue.
  await prisma.peerQueue.upsert({
    where: { userId: input.userId },
    create: { userId: input.userId, status: PeerQueueStatus.WAITING, problemFocus: input.problemFocus },
    update: { status: PeerQueueStatus.WAITING, problemFocus: input.problemFocus, joinedAt: new Date(), matchedMockId: null },
  });
  const ahead = await prisma.peerQueue.count({
    where: { status: PeerQueueStatus.WAITING, joinedAt: { lt: new Date() } },
  });
  return { matched: false as const, queuePosition: ahead };
}

export async function leaveQueue(userId: string): Promise<void> {
  await prisma.peerQueue.updateMany({
    where: { userId, status: PeerQueueStatus.WAITING },
    data: { status: PeerQueueStatus.CANCELED },
  });
}

export async function checkMatch(userId: string): Promise<{ matched: boolean; mockSessionId: string | null }> {
  const row = await prisma.peerQueue.findUnique({ where: { userId } });
  if (!row) return { matched: false, mockSessionId: null };
  return {
    matched: row.status === PeerQueueStatus.MATCHED,
    mockSessionId: row.matchedMockId,
  };
}
