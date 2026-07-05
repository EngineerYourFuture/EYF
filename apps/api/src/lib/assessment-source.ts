/**
 * Assessment question source — DB-first with a hardcoded-bank fallback.
 * Same pattern as mcq-source.ts: staff-authored rows (AssessmentBankQuestion)
 * win the moment they exist; the legacy TS bank keeps a fresh install alive.
 */
import { prisma } from "@eyf/db";
import {
  ASSESSMENT_BANK,
  type AssessmentQuestion,
  type Topic,
} from "./assessment-bank.js";

type Row = {
  id: string;
  area: string;
  topic: string;
  difficulty: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string | null;
};

const toQuestion = (r: Row): AssessmentQuestion => ({
  id: r.id,
  topic: r.topic as Topic,
  area: r.area as AssessmentQuestion["area"],
  difficulty: (r.difficulty as AssessmentQuestion["difficulty"]) ?? "medium",
  prompt: r.prompt,
  choices: r.choices,
  correctIndex: r.correctIndex,
  explanation: r.explanation ?? undefined,
});

async function dbActive(): Promise<boolean> {
  try {
    return (await prisma.assessmentBankQuestion.count({ where: { active: true } })) > 0;
  } catch {
    return false;
  }
}

/** The full live pool — DB when populated, legacy bank otherwise. */
export async function assessmentPoolSource(): Promise<AssessmentQuestion[]> {
  if (!(await dbActive())) return ASSESSMENT_BANK;
  const rows = await prisma.assessmentBankQuestion.findMany({ where: { active: true } });
  return rows.map(toQuestion);
}

/** Draw the standard 12 DSA + 4 CS + 4 aptitude session from the live pool. */
export async function pickQuestionsSource(opts?: { countDsa?: number; countCs?: number; countAptitude?: number }): Promise<AssessmentQuestion[]> {
  const pool = await assessmentPoolSource();
  const draw = (area: AssessmentQuestion["area"], n: number) => {
    const copy = pool.filter((q) => q.area === area);
    const out: AssessmentQuestion[] = [];
    for (let i = 0; i < n && copy.length > 0; i++) {
      out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]!);
    }
    return out;
  };
  return [
    ...draw("dsa", opts?.countDsa ?? 12),
    ...draw("cs", opts?.countCs ?? 4),
    ...draw("aptitude", opts?.countAptitude ?? 4),
  ];
}

/** Resolver for grading: DB ids first, legacy-bank ids as fallback — so
 *  in-flight sessions survive a bank→DB cutover. */
export async function assessmentLookupSource(ids: string[]): Promise<(id: string) => AssessmentQuestion | undefined> {
  const map = new Map<string, AssessmentQuestion>(ASSESSMENT_BANK.map((q) => [q.id, q]));
  if (ids.length) {
    try {
      const rows = await prisma.assessmentBankQuestion.findMany({ where: { id: { in: ids } } });
      for (const r of rows) map.set(r.id, toQuestion(r));
    } catch { /* bank map already covers legacy ids */ }
  }
  return (id: string) => map.get(id);
}

/** One-shot idempotent import of the legacy TS bank (by sourceId). */
export async function importLegacyAssessmentBank(): Promise<{ imported: number; total: number }> {
  let imported = 0;
  for (const q of ASSESSMENT_BANK) {
    const existing = await prisma.assessmentBankQuestion.findUnique({ where: { sourceId: q.id }, select: { id: true } });
    if (!existing) {
      await prisma.assessmentBankQuestion.create({
        data: {
          sourceId: q.id, area: q.area, topic: q.topic, difficulty: q.difficulty,
          prompt: q.prompt, choices: q.choices, correctIndex: q.correctIndex,
          explanation: q.explanation ?? null, active: true,
        },
      });
      imported += 1;
    }
  }
  return { imported, total: ASSESSMENT_BANK.length };
}
