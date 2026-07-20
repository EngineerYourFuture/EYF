/**
 * MCQ question source — DB-first with a hardcoded-bank fallback.
 *
 * Staff author questions in the admin portal (McqBankQuestion). Until the
 * table has active rows, every reader falls back to the legacy TS bank
 * (mcq-bank.ts) so a fresh install still works. The moment content exists in
 * the DB it wins — no code deploys to change questions.
 */
import { prisma, type McqCategory as DbMcqCategory } from "@eyf/db";
import {
  MCQ_BANK,
  getMcq,
  mcqCompanies,
  mcqCount,
  pickTest,
  type McqCategory,
  type McqQuestion,
} from "./mcq-bank.js";

type Row = {
  id: string;
  category: DbMcqCategory;
  topic: string;
  difficulty: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  companies: string[];
};

const toQuestion = (r: Row): McqQuestion => ({
  id: r.id,
  category: r.category as McqCategory,
  topic: r.topic,
  difficulty: (r.difficulty as McqQuestion["difficulty"]) ?? "medium",
  prompt: r.prompt,
  choices: r.choices,
  correctIndex: r.correctIndex,
  explanation: r.explanation,
  companies: r.companies,
});

/** True when staff-authored questions exist — the DB is the source of truth. */
async function dbActive(): Promise<boolean> {
  try {
    return (await prisma.mcqBankQuestion.count({ where: { active: true } })) > 0;
  } catch {
    return false; // e.g. table missing mid-migration — bank keeps the app alive
  }
}

export async function mcqCompaniesSource(): Promise<string[]> {
  if (!(await dbActive())) return mcqCompanies();
  const rows = await prisma.mcqBankQuestion.findMany({ where: { active: true }, select: { companies: true } });
  return [...new Set(rows.flatMap((r) => r.companies))].sort((a, b) => a.localeCompare(b));
}

export async function mcqCountSource(category: McqCategory, company?: string): Promise<number> {
  if (!(await dbActive())) return mcqCount(category, company);
  return prisma.mcqBankQuestion.count({
    where: {
      active: true,
      category: category as DbMcqCategory,
      ...(company ? { companies: { has: company } } : {}),
    },
  });
}

/** Draw a shuffled test — DB pool when populated, bank otherwise. */
export async function pickTestSource(opts: { category: McqCategory; company?: string; count?: number }): Promise<McqQuestion[]> {
  if (!(await dbActive())) return pickTest(opts);
  const count = opts.count ?? 10;
  let pool = await prisma.mcqBankQuestion.findMany({
    where: {
      active: true,
      category: opts.category as DbMcqCategory,
      ...(opts.company ? { companies: { has: opts.company } } : {}),
    },
  });
  if (pool.length < count) {
    pool = await prisma.mcqBankQuestion.findMany({
      where: { active: true, category: opts.category as DbMcqCategory },
    });
  }
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length)).map(toQuestion);
}

/**
 * Resolver for scoring: looks the answered ids up in the DB first, then the
 * legacy bank — so in-flight tests survive a bank→DB cutover mid-session.
 */
export async function mcqLookupSource(ids: string[]): Promise<(id: string) => McqQuestion | undefined> {
  const map = new Map<string, McqQuestion>();
  if (ids.length) {
    try {
      const rows = await prisma.mcqBankQuestion.findMany({ where: { id: { in: ids } } });
      for (const r of rows) map.set(r.id, toQuestion(r));
    } catch { /* fall through to the bank */ }
  }
  return (id: string) => map.get(id) ?? getMcq(id);
}

/** One-shot idempotent import of the legacy TS bank into the DB (by sourceId). */
export async function importLegacyBank(): Promise<{ imported: number; total: number }> {
  let imported = 0;
  for (const q of MCQ_BANK) {
    const data = {
      sourceId: q.id,
      category: q.category as DbMcqCategory,
      topic: q.topic,
      difficulty: q.difficulty,
      prompt: q.prompt,
      choices: q.choices,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      companies: q.companies,
      active: true,
    };
    const existing = await prisma.mcqBankQuestion.findUnique({ where: { sourceId: q.id }, select: { id: true } });
    if (!existing) {
      await prisma.mcqBankQuestion.create({ data });
      imported += 1;
    }
  }
  return { imported, total: MCQ_BANK.length };
}
