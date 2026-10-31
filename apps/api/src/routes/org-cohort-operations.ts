import { createHash } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { prisma } from "@eyf/db";
import { z } from "zod";
import { requireOrgCapability } from "../middleware/org.js";
import { cohortReport, scopedMembers } from "../services/cohort-report.js";
import { parseRosterCsv, csvDocument } from "../lib/roster-csv.js";
import { recordAudit } from "../lib/audit.js";

const missing = { success: false, error: { code: "NOT_FOUND", message: "Cohort or enrollment not found." } };
export async function orgCohortOperationsRoutes(app: FastifyInstance) {
  const access = { preHandler: [app.requireAuth, requireOrgCapability("learn:enroll")] };
  app.addHook("onSend", async (_req, reply) => { reply.header("Cache-Control", "private, no-store"); });
  app.post("/:orgId/cohorts/:cohortId/import", access, async (req, reply) => {
    const { cohortId } = req.params as { cohortId: string };
    const body = z.object({ csv: z.string().max(200_000), commit: z.boolean().default(false), previewHash: z.string().optional() }).strict().parse(req.body);
    if (!await prisma.cohort.findFirst({ where: { id: cohortId, orgId: req.orgCtx!.orgId }, select: { id: true } })) return reply.code(404).send(missing);
    const parsed = parseRosterCsv(body.csv);
    const members = await prisma.orgMember.findMany({ where: { ...scopedMembers(req.orgCtx!), user: { email: { in: parsed.filter((r) => r.status === "valid").map((r) => r.email), mode: "insensitive" } } }, select: { id: true, user: { select: { email: true } }, cohortEnrollments: { where: { cohortId }, select: { id: true } } } });
    const byEmail = new Map(members.map((m) => [m.user.email.toLowerCase(), m]));
    const rows = parsed.map((r) => {
      if (r.status !== "valid") return r;
      const member = byEmail.get(r.email);
      if (!member) return { ...r, status: "unavailable" };
      return { ...r, status: member.cohortEnrollments.length ? "enrolled" : "ready" };
    });
    // Bind confirmation to both the uploaded data and the currently visible membership.
    const previewHash = createHash("sha256").update(JSON.stringify({ cohortId, rows })).digest("hex");
    let enrolled = 0;
    if (body.commit) {
      if (body.previewHash !== previewHash) return reply.code(409).send({ success: false, error: { code: "PREVIEW_CHANGED", message: "The roster changed. Preview it again before importing." } });
      const ids = rows.filter((r) => r.status === "ready").map((r) => byEmail.get(r.email)!.id);
      // Recheck scope in a serializable transaction before enrolling.
      enrolled = await prisma.$transaction(async (tx) => {
        const valid = await tx.orgMember.findMany({ where: { ...scopedMembers(req.orgCtx!), id: { in: ids } }, select: { id: true } });
        return (await tx.cohortEnrollment.createMany({ data: valid.map((m) => ({ cohortId, memberId: m.id })), skipDuplicates: true })).count;
      }, { isolationLevel: "Serializable" });
      await recordAudit(req, { action: "create", entity: "cohort-import", entityId: cohortId, summary: `Enrolled ${enrolled} learners from CSV` });
    }
    return { success: true, data: { rows, previewHash, enrolled, ready: rows.filter((r) => r.status === "ready").length } };
  });
  app.patch("/:orgId/cohorts/:cohortId/drive", access, async (req, reply) => {
    // Department managers may enroll and follow up within their scope, but
    // cannot change eligibility rules affecting every department in the cohort.
    if (req.orgCtx!.scope !== "org") return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Organization-wide enrollment access is required to change drive rules." } });
    const { cohortId } = req.params as { cohortId: string };
    const data = z.object({ driveTitle: z.string().trim().min(2).max(120).nullable(), driveDeadline: z.string().datetime().nullable(), minimumProgress: z.number().int().min(0).max(100) }).strict().parse(req.body);
    const updated = await prisma.cohort.updateMany({ where: { id: cohortId, orgId: req.orgCtx!.orgId }, data });
    if (!updated.count) return reply.code(404).send(missing);
    await recordAudit(req, { action: "update", entity: "cohort-drive", entityId: cohortId, summary: `Updated drive criteria: ${data.minimumProgress}% required progress` });
    return { success: true, data: { saved: true } };
  });
  app.patch("/:orgId/cohorts/:cohortId/follow-ups/:enrollmentId", access, async (req, reply) => {
    const { cohortId, enrollmentId } = req.params as { cohortId: string; enrollmentId: string };
    const body = z.object({ status: z.enum(["NONE", "OPEN", "CONTACTED", "RESOLVED"]), note: z.string().trim().max(2000), dueAt: z.string().datetime().nullable() }).strict().parse(req.body);
    const updated = await prisma.cohortEnrollment.updateMany({ where: { id: enrollmentId, cohortId, cohort: { orgId: req.orgCtx!.orgId }, member: scopedMembers(req.orgCtx!) }, data: { followUpStatus: body.status, followUpNote: body.note, followUpDueAt: body.dueAt, followUpUpdatedAt: new Date() } });
    if (!updated.count) return reply.code(404).send(missing);
    await recordAudit(req, { action: "update", entity: "cohort-follow-up", entityId: enrollmentId, summary: `Follow-up set to ${body.status}` });
    return { success: true, data: { saved: true } };
  });
  app.get("/:orgId/cohorts/:cohortId/export", access, async (req, reply) => {
    const { cohortId } = req.params as { cohortId: string };
    const report = await cohortReport(cohortId, req.orgCtx!);
    if (!report) return reply.code(404).send(missing);
    const csv = csvDocument([
      ["Name", "Email", "Program progress %", "Enrollment", "Needs attention", "Eligible under course criteria", "Eligibility reasons", "Follow-up", "Follow-up due", "Follow-up note", "Report generated at"],
      ...report.rows.map((r) => [r.member.name, r.member.email, r.progressPct, r.status, r.stuckFlag, r.eligibility.eligible, r.eligibility.reasons.join(" "), r.followUp.status, r.followUp.dueAt?.toISOString(), r.followUp.note, report.generatedAt.toISOString()]),
    ]);
    return { success: true, data: { filename: `cohort-${cohortId}.csv`, csv } };
  });
}
