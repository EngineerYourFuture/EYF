/**
 * Communication prompt source — DB-first with a hardcoded-bank fallback.
 * Staff author drill prompts (CommunicationPromptBank) in the portal; the
 * legacy TS bank only serves a fresh install. The `covers` rubric rides along
 * so AI grading stays anchored regardless of source.
 */
import { prisma, type CommunicationKind as DbKind } from "@eyf/db";
import {
  COMMUNICATION_BANK,
  getPrompt,
  type CommunicationKind,
  type CommunicationPrompt,
} from "./communication-bank.js";

type Row = {
  id: string;
  kind: DbKind;
  question: string;
  tip: string;
  covers: string[];
};

const toPrompt = (r: Row): CommunicationPrompt => ({
  id: r.id,
  kind: r.kind as CommunicationKind,
  question: r.question,
  tip: r.tip,
  covers: r.covers,
});

async function dbActive(): Promise<boolean> {
  try {
    return (await prisma.communicationPromptBank.count({ where: { active: true } })) > 0;
  } catch {
    return false;
  }
}

export async function promptsSource(kind?: CommunicationKind): Promise<CommunicationPrompt[]> {
  if (!(await dbActive())) {
    return kind ? COMMUNICATION_BANK.filter((p) => p.kind === kind) : COMMUNICATION_BANK;
  }
  const rows = await prisma.communicationPromptBank.findMany({
    where: { active: true, ...(kind ? { kind: kind as DbKind } : {}) },
    orderBy: [{ kind: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(toPrompt);
}

/** DB id first, legacy-bank id fallback — in-flight drills survive a cutover. */
export async function getPromptSource(id: string): Promise<CommunicationPrompt | undefined> {
  try {
    const row = await prisma.communicationPromptBank.findUnique({ where: { id } });
    if (row) return toPrompt(row);
  } catch { /* fall through */ }
  return getPrompt(id);
}

/** One-shot idempotent import of the legacy TS bank (by sourceId). */
export async function importLegacyCommunicationBank(): Promise<{ imported: number; total: number }> {
  let imported = 0;
  for (const p of COMMUNICATION_BANK) {
    const existing = await prisma.communicationPromptBank.findUnique({ where: { sourceId: p.id }, select: { id: true } });
    if (!existing) {
      await prisma.communicationPromptBank.create({
        data: { sourceId: p.id, kind: p.kind as DbKind, question: p.question, tip: p.tip, covers: p.covers, active: true },
      });
      imported += 1;
    }
  }
  return { imported, total: COMMUNICATION_BANK.length };
}
