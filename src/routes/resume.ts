import { Router, Response } from "express";
import { z } from "zod";
import { Plan, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

const ResumeDataSchema = z.object({
  template: z.string().default("default"),
  data: z.object({
    personalInfo: z.object({
      name: z.string(),
      email: z.string(),
      phone: z.string().optional(),
      location: z.string().optional(),
      linkedin: z.string().optional(),
      github: z.string().optional(),
      website: z.string().optional(),
      summary: z.string().optional(),
    }).optional(),
    experience: z.array(z.object({
      company: z.string(),
      role: z.string(),
      startDate: z.string(),
      endDate: z.string().optional(),
      current: z.boolean().optional(),
      bullets: z.array(z.string()),
    })).optional(),
    education: z.array(z.object({
      institution: z.string(),
      degree: z.string(),
      field: z.string().optional(),
      startDate: z.string(),
      endDate: z.string().optional(),
      gpa: z.string().optional(),
    })).optional(),
    skills: z.array(z.object({
      category: z.string(),
      items: z.array(z.string()),
    })).optional(),
    projects: z.array(z.object({
      name: z.string(),
      description: z.string(),
      tech: z.array(z.string()),
      url: z.string().optional(),
      bullets: z.array(z.string()),
    })).optional(),
    certifications: z.array(z.object({
      name: z.string(),
      issuer: z.string(),
      date: z.string().optional(),
    })).optional(),
  }).passthrough(),
});

// GET /resume
router.get("/", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const resume = await prisma.resume.findUnique({ where: { userId: req.auth!.sub } });
  res.json({ resume: resume ?? null });
});

// PUT /resume
router.put("/", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const parse = ResumeDataSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: { code: "VALIDATION", message: parse.error.issues[0]?.message } });
    return;
  }

  const resume = await prisma.resume.upsert({
    where: { userId: req.auth!.sub },
    update: { template: parse.data.template, dataJson: parse.data.data as Prisma.InputJsonValue },
    create: { userId: req.auth!.sub, template: parse.data.template, dataJson: parse.data.data as Prisma.InputJsonValue },
  });

  res.json({ resume });
});

// POST /resume/export  (PDF export — requires basic plan+)
router.post("/export", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const entitlement = await prisma.planEntitlement.findUnique({
    where: { plan_featureKey: { plan: req.auth!.plan as Plan, featureKey: "resume_pdf_export" } },
  });
  if (!entitlement?.enabled) {
    res.status(403).json({ error: { code: "PLAN_REQUIRED", message: "PDF export requires Basic plan or above." } });
    return;
  }

  // MVP: return a placeholder — real impl would generate PDF via puppeteer/wkhtmltopdf
  res.json({ ok: true, message: "PDF export queued. Download will be available shortly." });
});

export { router as resumeRouter };
