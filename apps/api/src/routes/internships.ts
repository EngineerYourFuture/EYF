import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, InternshipStatus } from "@eyf/db";
import { standingFor, type RankCandidate, type InternshipStanding } from "../services/internship-ranking.js";

/**
 * Builds the caller's standing in the internship flywheel: rank the consented
 * talent pool (v1 signal = stored XP; see TODOS HARD-6) against the count of OPEN
 * Elite slot seats (the cutoff). Shared by /standing (the magnet surface) and
 * /elite-slots (the eligibility gate). `standing` is null when the caller hasn't
 * opted into the talent pool.
 */
async function loadStanding(userId: string): Promise<{ standing: InternshipStanding | null; seats: number; cohortSize: number }> {
  const [consents, slots] = await Promise.all([
    prisma.talentConsent.findMany({ where: { revokedAt: null }, select: { userId: true } }),
    prisma.internshipSlot.findMany({
      where: { eliteOnly: true, OR: [{ openUntil: null }, { openUntil: { gt: new Date() } }] },
      select: { seats: true },
    }),
  ]);
  const seats = slots.reduce((sum, s) => sum + s.seats, 0);
  const ids = consents.map((x) => x.userId);
  // A consented student with no profile row can't be ranked — exclude them so the
  // ranking reflects only rankable candidates.
  const profiles = ids.length
    ? await prisma.userProfile.findMany({ where: { userId: { in: ids } }, select: { userId: true, currentXp: true } })
    : [];
  const cohort: RankCandidate[] = profiles.map((p) => ({ userId: p.userId, score: p.currentXp }));
  return { standing: standingFor(cohort, seats, userId), seats, cohortSize: cohort.length };
}

export async function internshipRoutes(app: FastifyInstance) {
  app.get("/", async (req) => {
    const { q, role, remote, cursor, limit } = z.object({
      q: z.string().optional(),
      role: z.string().optional(),
      remote: z.coerce.boolean().optional(),
      cursor: z.string().optional(),
      limit: z.coerce.number().min(1).max(50).default(20),
    }).parse(req.query);
    const list = await prisma.internship.findMany({
      where: {
        isActive: true,
        ...(role && { role: { contains: role, mode: "insensitive" } }),
        ...(remote !== undefined && { remote }),
        ...(q && {
          OR: [
            { company: { contains: q, mode: "insensitive" } },
            { role: { contains: q, mode: "insensitive" } },
            { location: { contains: q, mode: "insensitive" } },
          ],
        }),
      },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { postedAt: "desc" },
    });
    const next = list.length > limit ? list.pop()!.id : null;
    return { success: true, data: list, meta: { cursor: next } };
  });

  app.get("/:slug", async (req, reply) => {
    const { slug } = z.object({ slug: z.string() }).parse(req.params);
    const i = await prisma.internship.findUnique({ where: { slug } });
    if (!i) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Internship not found" } });
    return { success: true, data: i };
  });

  app.get("/me/applications", { preHandler: app.requireAuth }, async (req) => {
    const list = await prisma.userInternship.findMany({
      where: { userId: req.session!.id },
      include: { internship: true },
      orderBy: { updatedAt: "desc" },
    });
    return { success: true, data: list };
  });

  app.post("/:slug/save", { preHandler: app.requireAuth }, async (req, reply) => {
    const { slug } = z.object({ slug: z.string() }).parse(req.params);
    const i = await prisma.internship.findUnique({ where: { slug } });
    if (!i) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Internship not found" } });
    const created = await prisma.userInternship.upsert({
      where: { userId_internshipId: { userId: req.session!.id, internshipId: i.id } },
      create: { userId: req.session!.id, internshipId: i.id, status: InternshipStatus.SAVED },
      update: {},
    });
    return { success: true, data: created };
  });

  /**
   * The student-facing "rank-to-internship" magnet (design doc: internship
   * flywheel). Ranks the consented talent pool and tells the caller where they
   * stand against the number of OPEN Elite slot seats — the cutoff that only
   * exists insofar as startups have actually sourced seats.
   *
   * v1 ranks on stored XP (a cheap, single indexed read). The ranking signal is
   * expected to become a materialized Readiness Index (TODOS HARD-6); the pure
   * `standingFor` engine is signal-agnostic, so that swap won't touch this route.
   */
  app.get("/standing", { preHandler: app.requireAuth }, async (req) => {
    const { standing, seats, cohortSize } = await loadStanding(req.session!.id);
    if (!standing) {
      // Caller hasn't opted into the talent pool (or has no profile yet).
      return { success: true, data: { inPool: false, seats, cohortSize } };
    }
    return { success: true, data: { inPool: true, ...standing } };
  });

  /**
   * The eligibility gate: the scarce, org-sourced Elite internship seats are only
   * revealed to students who earned the rank (rank ≤ open seats). Everyone else
   * gets their standing back so the UI can show the "earn your seat" state — the
   * seats stay aspirational, not hidden. This is what makes the ranking a prize.
   */
  app.get("/elite-slots", { preHandler: app.requireAuth }, async (req) => {
    const { standing } = await loadStanding(req.session!.id);
    if (!standing) {
      return { success: true, data: { eligible: false, inPool: false } };
    }
    if (!standing.eligible) {
      return { success: true, data: { eligible: false, inPool: true, standing } };
    }
    const slots = await prisma.internshipSlot.findMany({
      where: { eliteOnly: true, OR: [{ openUntil: null }, { openUntil: { gt: new Date() } }] },
      include: { org: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: { eligible: true, inPool: true, standing, slots } };
  });

  app.patch("/me/applications/:id", { preHandler: app.requireAuth }, async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const body = z.object({
      status: z.nativeEnum(InternshipStatus).optional(),
      notes: z.string().optional(),
    }).parse(req.body);
    const owned = await prisma.userInternship.findFirst({ where: { id, userId: req.session!.id } });
    if (!owned) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Application not found" } });
    const updated = await prisma.userInternship.update({
      where: { id },
      data: {
        ...body,
        ...(body.status === InternshipStatus.APPLIED && { appliedAt: new Date() }),
      },
    });
    return { success: true, data: updated };
  });
}
