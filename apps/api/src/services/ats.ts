/**
 * Phase 1 ATS scorer.
 *
 * Real ATS systems score on: keyword match vs JD, formatting (single column,
 * standard sections), file format (PDF text-extractable), and length. We have
 * no JD here yet, so we score on objective resume hygiene that ATS parsers
 * actually trip on.
 *
 * 0–100. Breakdown returned so the UI can show "+5 from quantified bullets".
 */
import type { ResumeDocument } from "@eyf/types";

export type AtsBreakdown = {
  total: number;
  factors: { name: string; score: number; max: number; note?: string }[];
};

export function scoreResume(doc: ResumeDocument): AtsBreakdown {
  const factors: AtsBreakdown["factors"] = [];

  // 1. Contact info present
  const contact = !!doc.contact?.email && !!doc.contact?.phone;
  factors.push({ name: "Contact info", score: contact ? 10 : 0, max: 10 });

  // 2. Has summary
  const sum = (doc.summary ?? "").trim();
  let summaryScore = 4;
  if (sum.length >= 50 && sum.length <= 400) summaryScore = 8;
  else if (sum.length === 0) summaryScore = 0;
  factors.push({ name: "Summary", score: summaryScore, max: 8 });

  // 3. Experience entries with bullets
  const expBullets = doc.experience?.reduce((a, e) => a + (e.bullets?.length ?? 0), 0) ?? 0;
  factors.push({ name: "Experience bullets", score: Math.min(15, expBullets * 3), max: 15 });

  // 4. Quantified bullets (contains number)
  const allBullets = doc.experience?.flatMap((e) => e.bullets ?? []) ?? [];
  const quantified = allBullets.filter((b) => /\d/.test(b)).length;
  factors.push({ name: "Quantified impact", score: Math.min(15, quantified * 3), max: 15, note: `${quantified} of ${allBullets.length} bullets have numbers` });

  // 5. Action verbs at bullet start
  const actionVerbs = new Set(["built","shipped","led","reduced","increased","designed","implemented","launched","optimized","architected","delivered","scaled","migrated","drove","owned"]);
  const startsAction = allBullets.filter((b) => {
    const w = b.trim().split(/\s+/)[0]?.toLowerCase();
    return w ? actionVerbs.has(w) : false;
  }).length;
  factors.push({ name: "Action-verb bullets", score: Math.min(12, startsAction * 2), max: 12 });

  // 6. Skills count
  const skills = doc.skills?.length ?? 0;
  factors.push(
    { name: "Skills listed", score: Math.min(10, Math.floor(skills / 2)), max: 10 },
    // 7. Education present
    { name: "Education", score: (doc.education?.length ?? 0) > 0 ? 8 : 0, max: 8 },
  );

  // 8. Projects with link
  const projWithLink = doc.projects?.filter((p) => p.link).length ?? 0;
  factors.push({ name: "Project links", score: Math.min(12, projWithLink * 4), max: 12 });

  // 9. Length sanity (target 1 page-ish = under 700 words)
  const wordCount =
    (doc.summary ?? "").split(/\s+/).length +
    allBullets.join(" ").split(/\s+/).length;
  let lengthScore = 2;
  if (wordCount <= 700) lengthScore = 10;
  else if (wordCount <= 1000) lengthScore = 6;
  factors.push({
    name: "Length",
    score: lengthScore,
    max: 10,
    note: `${wordCount} words`,
  });

  const total = factors.reduce((a, f) => a + f.score, 0);
  return { total, factors };
}

/* ─── Gap-to-target — the Resume differentiator ──────────────────────
 * Competitors give a static ATS score. EYF scores your resume against YOUR
 * target role: which expected keywords are missing, and the exact rewrites to
 * clear that role's bar. Pure + deterministic; the LLM is not required.
 */
const ROLE_KEYWORDS: Record<string, string[]> = {
  frontend: ["react", "typescript", "javascript", "css", "html", "responsive", "accessibility", "performance", "testing", "redux", "next.js", "tailwind"],
  backend:  ["api", "rest", "database", "sql", "microservices", "docker", "caching", "redis", "scalability", "system design", "authentication", "kubernetes"],
  fullstack:["react", "typescript", "node", "api", "database", "sql", "docker", "rest", "testing", "system design", "authentication"],
  data:     ["python", "sql", "pandas", "numpy", "machine learning", "statistics", "data pipeline", "spark", "visualization", "tensorflow", "etl"],
  sde:      ["data structures", "algorithms", "system design", "git", "testing", "ci/cd", "object-oriented", "rest api", "database", "docker"],
};
const ROLE_LABEL: Record<string, string> = {
  frontend: "Frontend", backend: "Backend", fullstack: "Full-stack", data: "Data / ML", sde: "Software Engineer",
};
function roleKey(targetRole?: string | null): keyof typeof ROLE_KEYWORDS {
  const r = (targetRole ?? "").toLowerCase();
  if (/front|\bui\b/.test(r)) return "frontend";
  if (/full.?stack/.test(r)) return "fullstack";
  if (/back|server/.test(r)) return "backend";
  if (/data|\bml\b|\bai\b|scien|analyst/.test(r)) return "data";
  return "sde";
}
const cap = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

export type ResumeGap = {
  roleLabel: string;
  matchPct: number;
  matched: string[];
  missing: string[];
  fixes: { label: string; detail: string; severity: "high" | "med" }[];
};

export function resumeGapToTarget(doc: ResumeDocument, targetRole?: string | null): ResumeGap {
  const key = roleKey(targetRole);
  const keywords = ROLE_KEYWORDS[key]!;
  const roleLabel = ROLE_LABEL[key]!;
  const hay = [
    ...(doc.skills ?? []),
    ...(doc.experience?.flatMap((e) => e.bullets ?? []) ?? []),
    ...(doc.projects?.flatMap((p) => [p.name, p.description].filter(Boolean) as string[]) ?? []),
    doc.summary ?? "",
  ].join(" ").toLowerCase();

  const matched = keywords.filter((k) => hay.includes(k));
  const missing = keywords.filter((k) => !hay.includes(k));
  const matchPct = keywords.length ? Math.round((matched.length / keywords.length) * 100) : 0;

  const fixes: ResumeGap["fixes"] = [];
  if (missing.length) {
    fixes.push({
      label: `Show ${missing.slice(0, 4).map(cap).join(", ")}`,
      detail: `Expected for ${roleLabel} roles but not on your resume. Add a project or bullet that genuinely demonstrates ${missing.length === 1 ? "it" : "them"}.`,
      severity: "high",
    });
  }
  const allBullets = doc.experience?.flatMap((e) => e.bullets ?? []) ?? [];
  const unquantified = allBullets.filter((b) => !/\d/.test(b)).length;
  if (allBullets.length && unquantified > 0) {
    fixes.push({
      label: `Quantify ${unquantified} more bullet${unquantified === 1 ? "" : "s"}`,
      detail: "Recruiters scan for impact numbers (%, ₹, users, ms). Add a metric to every bullet that lacks one.",
      severity: "high",
    });
  }
  if ((doc.projects?.filter((p) => p.link).length ?? 0) === 0) {
    fixes.push({
      label: "Add a project with a live link",
      detail: `${roleLabel} interviewers open your projects — a working demo + GitHub link is high signal.`,
      severity: "med",
    });
  }
  if ((doc.skills?.length ?? 0) < 8) {
    fixes.push({
      label: "Expand your skills section",
      detail: "List the concrete tools and languages you know — ATS keyword-matches against this section first.",
      severity: "med",
    });
  }

  return { roleLabel, matchPct, matched, missing, fixes };
}
