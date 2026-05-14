import PDFDocument from "pdfkit";
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

  const parse = ResumeDataSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: { code: "VALIDATION", message: parse.error.issues[0]?.message } });
    return;
  }

  const { data: rd } = parse.data;
  const pi = rd.personalInfo;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="resume.pdf"');

  const doc = new PDFDocument({ margin: 50, size: "A4" });
  doc.pipe(res);

  const accent = "#c0392b";
  const textColor = "#1a1a1a";
  const mutedColor = "#555555";
  const W = doc.page.width - 100;

  const section = (title: string) => {
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor(accent).font("Helvetica-Bold").text(title.toUpperCase(), { characterSpacing: 1.5 });
    doc.moveTo(50, doc.y).lineTo(50 + W, doc.y).strokeColor(accent).lineWidth(0.5).stroke();
    doc.moveDown(0.3);
    doc.fillColor(textColor);
  };

  // Header
  doc.fontSize(22).font("Helvetica-Bold").fillColor(textColor).text(pi?.name ?? "Your Name");
  const contactParts = [pi?.email, pi?.phone, pi?.location, pi?.linkedin, pi?.github].filter(Boolean);
  doc.fontSize(9).font("Helvetica").fillColor(mutedColor).text(contactParts.join("  ·  "), { lineGap: 2 });
  if (pi?.summary) {
    doc.moveDown(0.4).fontSize(9.5).fillColor(textColor).text(pi.summary, { lineGap: 2 });
  }

  // Experience
  if (rd.experience?.length) {
    section("Experience");
    for (const exp of rd.experience) {
      const dateStr = exp.endDate ? `${exp.startDate} – ${exp.endDate}` : exp.current ? `${exp.startDate} – Present` : exp.startDate;
      doc.fontSize(10).font("Helvetica-Bold").fillColor(textColor).text(`${exp.role}  —  ${exp.company}`, { continued: false });
      doc.fontSize(8.5).font("Helvetica").fillColor(mutedColor).text(dateStr);
      for (const bullet of exp.bullets.filter(Boolean)) {
        doc.fontSize(9).fillColor(textColor).text(`•  ${bullet}`, { indent: 10, lineGap: 1 });
      }
      doc.moveDown(0.3);
    }
  }

  // Education
  if (rd.education?.length) {
    section("Education");
    for (const edu of rd.education) {
      const degreeStr = [edu.degree, edu.field].filter(Boolean).join(", ");
      doc.fontSize(10).font("Helvetica-Bold").fillColor(textColor).text(degreeStr);
      const metaParts = [edu.institution, edu.startDate, edu.gpa ? `GPA: ${edu.gpa}` : null].filter(Boolean);
      doc.fontSize(8.5).font("Helvetica").fillColor(mutedColor).text(metaParts.join("  ·  "));
      doc.moveDown(0.3);
    }
  }

  // Skills
  if (rd.skills?.length) {
    section("Skills");
    for (const sg of rd.skills) {
      doc.fontSize(9).font("Helvetica-Bold").fillColor(textColor).text(`${sg.category}: `, { continued: true });
      doc.font("Helvetica").fillColor(mutedColor).text(sg.items.join(", "), { lineGap: 1 });
    }
    doc.moveDown(0.3);
  }

  // Projects
  if (rd.projects?.length) {
    section("Projects");
    for (const proj of rd.projects) {
      doc.fontSize(10).font("Helvetica-Bold").fillColor(textColor).text(proj.name, { continued: proj.tech.length > 0 });
      if (proj.tech.length) doc.font("Helvetica").fillColor(mutedColor).text(`  ·  ${proj.tech.join(", ")}`);
      if (proj.description) doc.fontSize(9).fillColor(textColor).text(proj.description, { lineGap: 1 });
      for (const b of proj.bullets.filter(Boolean)) {
        doc.fontSize(9).fillColor(textColor).text(`•  ${b}`, { indent: 10, lineGap: 1 });
      }
      doc.moveDown(0.3);
    }
  }

  // Certifications
  if (rd.certifications?.length) {
    section("Certifications");
    for (const cert of rd.certifications) {
      doc.fontSize(9).font("Helvetica-Bold").fillColor(textColor).text(cert.name, { continued: true });
      doc.font("Helvetica").fillColor(mutedColor).text(`  —  ${cert.issuer}${cert.date ? ", " + cert.date : ""}`);
    }
  }

  doc.end();
});

export { router as resumeRouter };
