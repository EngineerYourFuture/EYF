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
  factors.push({ name: "Summary", score: sum.length >= 50 && sum.length <= 400 ? 8 : sum.length === 0 ? 0 : 4, max: 8 });

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
  factors.push({ name: "Skills listed", score: Math.min(10, Math.floor(skills / 2)), max: 10 });

  // 7. Education present
  factors.push({ name: "Education", score: (doc.education?.length ?? 0) > 0 ? 8 : 0, max: 8 });

  // 8. Projects with link
  const projWithLink = doc.projects?.filter((p) => p.link).length ?? 0;
  factors.push({ name: "Project links", score: Math.min(12, projWithLink * 4), max: 12 });

  // 9. Length sanity (target 1 page-ish = under 700 words)
  const wordCount =
    (doc.summary ?? "").split(/\s+/).length +
    allBullets.join(" ").split(/\s+/).length;
  factors.push({
    name: "Length",
    score: wordCount <= 700 ? 10 : wordCount <= 1000 ? 6 : 2,
    max: 10,
    note: `${wordCount} words`,
  });

  const total = factors.reduce((a, f) => a + f.score, 0);
  return { total, factors };
}
