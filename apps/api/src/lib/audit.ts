import { prisma } from "@eyf/db";
import type { FastifyRequest } from "fastify";

/**
 * Record a staff back-office action. Best-effort: an audit-write failure must
 * never fail the underlying mutation, so we swallow errors. Call AFTER the
 * mutation succeeds, with the acting session.
 */
export async function recordAudit(
  req: FastifyRequest,
  entry: { action: string; entity: string; entityId: string; summary: string },
): Promise<void> {
  const session = req.session;
  if (!session) return;
  try {
    await prisma.auditLog.create({
      data: {
        actorId: session.id,
        actorEmail: session.email,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        summary: entry.summary,
      },
    });
  /* c8 ignore start -- best-effort audit; the catch only fires on a DB write failure. */
  } catch {
    req.log?.warn?.({ entry }, "audit log write failed");
  }
  /* c8 ignore stop */
}
