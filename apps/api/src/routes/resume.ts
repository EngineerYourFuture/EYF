import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@eyf/db";
import type { ResumeDocument } from "@eyf/types";
import { scoreResume, resumeGapToTarget } from "../services/ats.js";
import { renderResumePdf } from "../services/pdf.js";

const resumeDocSchema: z.ZodType<ResumeDocument> = z.object({
  contact: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    location: z.string().optional(),
    github: z.string().optional(),
    linkedin: z.string().optional(),
    portfolio: z.string().optional(),
  }),
  summary: z.string().optional(),
  skills: z.array(z.string()).optional(),
  experience: z.array(z.object({
    company: z.string(), role: z.string(),
    start: z.string(), end: z.string().optional(),
    bullets: z.array(z.string()),
  })).optional(),
  projects: z.array(z.object({
    name: z.string(), description: z.string(),
    link: z.string().optional(), techStack: z.array(z.string()).optional(),
  })).optional(),
  education: z.array(z.object({
    institution: z.string(), degree: z.string(),
    start: z.string(), end: z.string().optional(), gpa: z.string().optional(),
  })).optional(),
  achievements: z.array(z.string()).optional(),
});

export async function resumeRoutes(app: FastifyInstance) {
  app.get("/me", { preHandler: app.requireAuth }, async (req) => {
    const list = await prisma.resume.findMany({
      where: { userId: req.session!.id },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    });
    return { success: true, data: list };
  });

  app.get("/:id", { preHandler: app.requireAuth }, async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const r = await prisma.resume.findFirst({ where: { id, userId: req.session!.id } });
    if (!r) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Resume not found" } });
    return { success: true, data: r };
  });

  app.post("/", { preHandler: app.requireAuth }, async (req) => {
    const body = z.object({
      title: z.string().default("My Resume"),
      template: z.enum(["classic", "compact", "modern"]).default("classic"),
      json: resumeDocSchema,
    }).parse(req.body);
    const ats = scoreResume(body.json);
    const created = await prisma.resume.create({
      data: {
        userId: req.session!.id,
        title: body.title,
        template: body.template,
        json: body.json,
        atsScore: ats.total,
        atsBreakdown: ats,
        isDefault: false,
      },
    });
    return { success: true, data: created };
  });

  app.patch("/:id", { preHandler: app.requireAuth }, async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const body = z.object({
      title: z.string().optional(),
      template: z.enum(["classic", "compact", "modern"]).optional(),
      json: resumeDocSchema.optional(),
      isDefault: z.boolean().optional(),
    }).parse(req.body);
    const owned = await prisma.resume.findFirst({ where: { id, userId: req.session!.id } });
    if (!owned) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Resume not found" } });
    const ats = body.json ? scoreResume(body.json) : null;
    if (body.isDefault) {
      await prisma.resume.updateMany({
        where: { userId: req.session!.id, isDefault: true },
        data: { isDefault: false },
      });
    }
    const updated = await prisma.resume.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.template && { template: body.template }),
        ...(body.json && { json: body.json }),
        ...(ats && { atsScore: ats.total, atsBreakdown: ats }),
        ...(body.isDefault !== undefined && { isDefault: body.isDefault }),
      },
    });
    return { success: true, data: updated };
  });

  app.get("/:id/pdf", { preHandler: app.requireAuth }, async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const r = await prisma.resume.findFirst({ where: { id, userId: req.session!.id } });
    if (!r) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Resume not found" } });
    const pdf = await renderResumePdf(r.json as ResumeDocument);
    return reply
      .header("content-type", "application/pdf")
      .header("content-disposition", `attachment; filename="${r.title.replace(/[^a-z0-9]+/gi, "_")}.pdf"`)
      .send(pdf);
  });

  app.post("/:id/score", { preHandler: app.requireAuth }, async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const r = await prisma.resume.findFirst({ where: { id, userId: req.session!.id } });
    if (!r) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Resume not found" } });
    const ats = scoreResume(r.json as ResumeDocument);
    await prisma.resume.update({ where: { id }, data: { atsScore: ats.total, atsBreakdown: ats } });
    return { success: true, data: ats };
  });

  // Gap-to-target — the Resume differentiator. Scores the resume against the
  // student's target role (from their latest roadmap) and returns exact fixes.
  app.get("/:id/gap", { preHandler: app.requireAuth }, async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const userId = req.session!.id;
    const [r, roadmap] = await Promise.all([
      prisma.resume.findFirst({ where: { id, userId } }),
      prisma.userRoadmap.findFirst({ where: { userId }, orderBy: { startedAt: "desc" }, select: { targetRole: true } }),
    ]);
    if (!r) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Resume not found" } });
    const gap = resumeGapToTarget(r.json as ResumeDocument, roadmap?.targetRole);
    return { success: true, data: gap };
  });
}
