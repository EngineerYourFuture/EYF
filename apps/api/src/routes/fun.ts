import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@eyf/db";
import type { ResumeDocument } from "@eyf/types";
import { roastResume } from "../services/roast.js";
import { renderOfferLetter } from "../services/offer-letter.js";

export async function funRoutes(app: FastifyInstance) {
  // Get Roasted on your default resume. Pro-gated (it costs us a Sonnet call).
  app.post(
    "/roast/:resumeId",
    { preHandler: [app.requireAuth, app.requirePlan(["pro", "elite"])] },
    async (req, reply) => {
      const { resumeId } = z.object({ resumeId: z.string() }).parse(req.params);
      const r = await prisma.resume.findFirst({ where: { id: resumeId, userId: req.session!.id } });
      if (!r) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Resume not found" } });
      try {
        const roast = await roastResume(r.json as ResumeDocument);
        return { success: true, data: roast };
      } catch (err) {
        req.log.error({ err }, "roast failed");
        return reply.code(503).send({ success: false, error: { code: "AI_UNAVAILABLE", message: (err as Error).message } });
      }
    },
  );

  // Mock offer letter PDF. Pure fun, free for all tiers.
  app.get("/offer-letter", { preHandler: app.requireAuth }, async (req, reply) => {
    const q = z.object({
      company: z.string().default("Razorpay"),
      role: z.string().default("Software Engineer"),
      location: z.string().default("Bangalore"),
      startDate: z.string().default(defaultStart()),
      ctcLpa: z.coerce.number().default(28),
      joiningBonusInr: z.coerce.number().optional(),
      esopValueInr: z.coerce.number().optional(),
    }).parse(req.query);
    const user = await prisma.user.findUnique({ where: { id: req.session!.id }, select: { name: true } });
    const pdf = await renderOfferLetter({
      candidateName: user?.name ?? "Future Engineer",
      company: q.company,
      role: q.role,
      location: q.location,
      startDate: q.startDate,
      ctcInr: q.ctcLpa * 100_000,
      joiningBonusInr: q.joiningBonusInr,
      esopValueInr: q.esopValueInr,
    });
    return reply
      .header("content-type", "application/pdf")
      .header("content-disposition", `attachment; filename="${q.company.replace(/[^a-z0-9]+/gi, "_")}-offer-letter.pdf"`)
      .send(pdf);
  });
}

function defaultStart(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 6);
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
}
