/**
 * Student talent-pool consent (PRD §21 — consent-first hiring). Platform-
 * scoped (not org): a student opts into the pool once, choosing anonymity
 * level, and can revoke any time. Only opted-in students are searchable by
 * recruiters (see org-hire.ts). This is a trust primitive, not a feature flag.
 */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, TalentScope } from "@eyf/db";

export async function talentRoutes(app: FastifyInstance) {
  app.get("/consent", { preHandler: app.requireAuth }, async (req) => {
    const consent = await prisma.talentConsent.findUnique({ where: { userId: req.session!.id } });
    return {
      success: true,
      data: consent && !consent.revokedAt
        ? { inPool: true, scope: consent.scope, grantedAt: consent.grantedAt }
        : { inPool: false, scope: null },
    };
  });

  app.post("/consent", { preHandler: app.requireAuth }, async (req) => {
    const { scope } = z.object({ scope: z.nativeEnum(TalentScope).default(TalentScope.POOL_ANON) }).parse(req.body ?? {});
    const consent = await prisma.talentConsent.upsert({
      where: { userId: req.session!.id },
      update: { scope, revokedAt: null, grantedAt: new Date() },
      create: { userId: req.session!.id, scope },
    });
    return { success: true, data: { inPool: true, scope: consent.scope } };
  });

  app.post("/consent/revoke", { preHandler: app.requireAuth }, async (req) => {
    await prisma.talentConsent.updateMany({ where: { userId: req.session!.id, revokedAt: null }, data: { revokedAt: new Date() } });
    return { success: true, data: { inPool: false } };
  });
}
