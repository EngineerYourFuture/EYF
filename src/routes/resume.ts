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

type ResumeDoc = InstanceType<typeof PDFDocument>;
type ParsedResumeData = NonNullable<ReturnType<typeof ResumeDataSchema.safeParse> & { success: true }>["data"]["data"];

const PDF_ACCENT = "#c0392b";
const PDF_TEXT = "#1a1a1a";
const PDF_MUTED = "#555555";

function pdfSection(doc: ResumeDoc, title: string) {
  const W = doc.page.width - 100;
  doc.moveDown(0.5);
  doc.fontSize(9).fillColor(PDF_ACCENT).font("Helvetica-Bold").text(title.toUpperCase(), { characterSpacing: 1.5 });
  doc.moveTo(50, doc.y).lineTo(50 + W, doc.y).strokeColor(PDF_ACCENT).lineWidth(0.5).stroke();
  doc.moveDown(0.3);
  doc.fillColor(PDF_TEXT);
}

function pdfHeader(doc: ResumeDoc, pi: ParsedResumeData["personalInfo"]) {
  doc.fontSize(22).font("Helvetica-Bold").fillColor(PDF_TEXT).text(pi?.name ?? "Your Name");
  const contact = [pi?.email, pi?.phone, pi?.location, pi?.linkedin, pi?.github].filter(Boolean);
  doc.fontSize(9).font("Helvetica").fillColor(PDF_MUTED).text(contact.join("  ·  "), { lineGap: 2 });
  if (pi?.summary) {
    doc.moveDown(0.4).fontSize(9.5).fillColor(PDF_TEXT).text(pi.summary, { lineGap: 2 });
  }
}

function pdfExperience(doc: ResumeDoc, experience: NonNullable<ParsedResumeData["experience"]>) {
  pdfSection(doc, "Experience");
  for (const exp of experience) {
    let dateStr: string;
    if (exp.endDate) {
      dateStr = `${exp.startDate} – ${exp.endDate}`;
    } else if (exp.current) {
      dateStr = `${exp.startDate} – Present`;
    } else {
      dateStr = exp.startDate;
    }
    doc.fontSize(10).font("Helvetica-Bold").fillColor(PDF_TEXT).text(`${exp.role}  —  ${exp.company}`, { continued: false });
    doc.fontSize(8.5).font("Helvetica").fillColor(PDF_MUTED).text(dateStr);
    for (const bullet of exp.bullets.filter(Boolean)) {
      doc.fontSize(9).fillColor(PDF_TEXT).text(`•  ${bullet}`, { indent: 10, lineGap: 1 });
    }
    doc.moveDown(0.3);
  }
}

function pdfEducation(doc: ResumeDoc, education: NonNullable<ParsedResumeData["education"]>) {
  pdfSection(doc, "Education");
  for (const edu of education) {
    const degreeStr = [edu.degree, edu.field].filter(Boolean).join(", ");
    doc.fontSize(10).font("Helvetica-Bold").fillColor(PDF_TEXT).text(degreeStr);
    const meta = [edu.institution, edu.startDate, edu.gpa ? `GPA: ${edu.gpa}` : null].filter(Boolean);
    doc.fontSize(8.5).font("Helvetica").fillColor(PDF_MUTED).text(meta.join("  ·  "));
    doc.moveDown(0.3);
  }
}

function pdfSkills(doc: ResumeDoc, skills: NonNullable<ParsedResumeData["skills"]>) {
  pdfSection(doc, "Skills");
  for (const sg of skills) {
    doc.fontSize(9).font("Helvetica-Bold").fillColor(PDF_TEXT).text(`${sg.category}: `, { continued: true });
    doc.font("Helvetica").fillColor(PDF_MUTED).text(sg.items.join(", "), { lineGap: 1 });
  }
  doc.moveDown(0.3);
}

function pdfProjects(doc: ResumeDoc, projects: NonNullable<ParsedResumeData["projects"]>) {
  pdfSection(doc, "Projects");
  for (const proj of projects) {
    doc.fontSize(10).font("Helvetica-Bold").fillColor(PDF_TEXT).text(proj.name, { continued: proj.tech.length > 0 });
    if (proj.tech.length) doc.font("Helvetica").fillColor(PDF_MUTED).text(`  ·  ${proj.tech.join(", ")}`);
    if (proj.description) doc.fontSize(9).fillColor(PDF_TEXT).text(proj.description, { lineGap: 1 });
    for (const b of proj.bullets.filter(Boolean)) {
      doc.fontSize(9).fillColor(PDF_TEXT).text(`•  ${b}`, { indent: 10, lineGap: 1 });
    }
    doc.moveDown(0.3);
  }
}

function pdfCertifications(doc: ResumeDoc, certifications: NonNullable<ParsedResumeData["certifications"]>) {
  pdfSection(doc, "Certifications");
  for (const cert of certifications) {
    const suffix = cert.date ? `, ${cert.date}` : "";
    doc.fontSize(9).font("Helvetica-Bold").fillColor(PDF_TEXT).text(cert.name, { continued: true });
    doc.font("Helvetica").fillColor(PDF_MUTED).text(`  —  ${cert.issuer}${suffix}`);
  }
}

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

  const rd = parse.data.data;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="resume.pdf"');

  const doc = new PDFDocument({ margin: 50, size: "A4" });
  doc.pipe(res);

  pdfHeader(doc, rd.personalInfo);
  if (rd.experience?.length) pdfExperience(doc, rd.experience);
  if (rd.education?.length) pdfEducation(doc, rd.education);
  if (rd.skills?.length) pdfSkills(doc, rd.skills);
  if (rd.projects?.length) pdfProjects(doc, rd.projects);
  if (rd.certifications?.length) pdfCertifications(doc, rd.certifications);

  doc.end();
});

export { router as resumeRouter };
