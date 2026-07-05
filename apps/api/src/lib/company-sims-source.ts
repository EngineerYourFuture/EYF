/**
 * Company-sim blueprint source — DB-first with the hardcoded list as fallback.
 * Staff manage the exact section layouts (TCS NQT, AMCAT, …) in the portal;
 * the sim runner keeps reusing /mcq/start per section either way.
 */
import { prisma } from "@eyf/db";
import { COMPANY_SIMS, type CompanySim, type SimSection } from "./company-sims.js";

async function dbActive(): Promise<boolean> {
  try {
    return (await prisma.companySimBlueprint.count({ where: { active: true } })) > 0;
  } catch {
    return false;
  }
}

export async function companySimsSource(): Promise<CompanySim[]> {
  if (!(await dbActive())) return COMPANY_SIMS;
  const rows = await prisma.companySimBlueprint.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((r) => ({
    slug: r.slug,
    company: r.company,
    label: r.label,
    blurb: r.blurb,
    usedBy: r.usedBy,
    sections: r.sections as SimSection[],
  }));
}

/** One-shot idempotent import of the hardcoded sims (by slug). */
export async function importLegacySims(): Promise<{ imported: number; total: number }> {
  let imported = 0;
  for (const s of COMPANY_SIMS) {
    const existing = await prisma.companySimBlueprint.findUnique({ where: { slug: s.slug }, select: { id: true } });
    if (!existing) {
      await prisma.companySimBlueprint.create({
        data: { slug: s.slug, company: s.company, label: s.label, blurb: s.blurb, usedBy: s.usedBy, sections: s.sections, active: true },
      });
      imported += 1;
    }
  }
  return { imported, total: COMPANY_SIMS.length };
}
