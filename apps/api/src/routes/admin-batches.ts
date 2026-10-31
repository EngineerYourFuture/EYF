import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, PlacementStatus } from "@eyf/db";
import { collegeSlug, calibrateBatch, READINESS_ALGO_VERSION, type CalibrationMember } from "@eyf/types";
import { requirePermission } from "../middleware/permissions.js";

/**
 * TPO batch rosters (Proof Loop Phase 2, docs/PLAN-proof-loop.md). Admin-gated for now —
 * a design-partner TPO is onboarded by EYF staff until self-serve college accounts exist.
 * This is the workflow that yields cohort-complete outcome data: record the WHOLE graduating
 * batch's placement status, mark it complete, and the (internal) calibration becomes real.
 */
export async function adminBatchRoutes(app: FastifyInstance) {
  const gate = requirePermission("manage:users");
  const pre = { preHandler: [app.requireAuth, gate] };

  // Create (or fetch) a graduating batch for a college. Canonicalizes the college by slug.
  app.post("/", pre, async (req) => {
    const { collegeName, gradYear } = z.object({
      collegeName: z.string().min(2),
      gradYear: z.number().int().gte(2000).lte(2100),
    }).parse(req.body ?? {});
    const slug = collegeSlug(collegeName);
    const college = await prisma.college.upsert({
      where: { slug },
      update: {},
      create: { slug, name: collegeName.trim() },
    });
    const batch = await prisma.batchCohort.upsert({
      where: { collegeId_gradYear: { collegeId: college.id, gradYear } },
      update: {},
      create: { collegeId: college.id, gradYear },
    });
    return { success: true, data: { batchId: batch.id, college: college.name, gradYear, dataComplete: batch.dataComplete } };
  });

  // Add a roster member. If a userId is given and that user placed through EYF, we copy the
  // frozen readiness band from their verified outcome so calibration has a real signal.
  app.post("/:batchId/members", pre, async (req, reply) => {
    const { batchId } = req.params as { batchId: string };
    const body = z.object({
      studentName: z.string().min(1),
      userId: z.string().nullish(),
      status: z.nativeEnum(PlacementStatus).default(PlacementStatus.SEARCHING),
    }).parse(req.body ?? {});
    const batch = await prisma.batchCohort.findUnique({ where: { id: batchId } });
    if (!batch) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Batch not found." } });

    let readinessBand: string | null = null;
    let snapshotVersion: string | null = null;
    let outcomeId: string | null = null;
    if (body.userId) {
      const outcome = await prisma.placementOutcome.findFirst({
        where: { userId: body.userId },
        orderBy: { placedAt: "desc" },
        select: { id: true, readinessBand: true, snapshotVersion: true },
      });
      if (outcome) {
        readinessBand = outcome.readinessBand;
        snapshotVersion = outcome.snapshotVersion;
        outcomeId = outcome.id;
      }
    }
    const member = await prisma.batchMember.create({
      data: {
        batchId,
        userId: body.userId ?? null,
        studentName: body.studentName.trim(),
        status: body.status,
        readinessBand,
        snapshotVersion,
        outcomeId,
      },
      select: { id: true, studentName: true, status: true, readinessBand: true },
    });
    return reply.code(201).send({ success: true, data: member });
  });

  app.patch("/:batchId/members/:memberId", pre, async (req) => {
    const { memberId } = req.params as { memberId: string };
    const { status } = z.object({ status: z.nativeEnum(PlacementStatus) }).parse(req.body ?? {});
    await prisma.batchMember.update({ where: { id: memberId }, data: { status } });
    return { success: true, data: { id: memberId, status } };
  });

  // Mark the roster complete — the survivorship guard the calibration engine checks.
  app.post("/:batchId/complete", pre, async (req) => {
    const { batchId } = req.params as { batchId: string };
    const batch = await prisma.batchCohort.update({
      where: { id: batchId },
      data: { dataComplete: true, completedAt: new Date() },
    });
    return { success: true, data: { batchId: batch.id, dataComplete: batch.dataComplete } };
  });

  // Internal calibration for one batch — null until the batch is complete + a band clears K.
  app.get("/:batchId/calibration", pre, async (req, reply) => {
    const { batchId } = req.params as { batchId: string };
    const batch = await prisma.batchCohort.findUnique({
      where: { id: batchId },
      include: { members: { select: { readinessBand: true, snapshotVersion: true, status: true } } },
    });
    if (!batch) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Batch not found." } });
    const members: CalibrationMember[] = batch.members;
    const calibration = calibrateBatch(members, { version: READINESS_ALGO_VERSION, dataComplete: batch.dataComplete });
    return { success: true, data: { dataComplete: batch.dataComplete, calibration } };
  });
}
