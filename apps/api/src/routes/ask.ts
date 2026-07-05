/**
 * Ask EYF — tech-stack Q&A backed by EYF's OWN knowledge base.
 *
 * Flow: search knowledge_entries (Postgres FTS) for a close existing answer →
 * serve it (and bump askCount). Miss → EYF Intelligence (Claude) writes an
 * ORIGINAL answer, which is stored as a new entry for every future student.
 * The corpus is 100% EYF-authored (AI + staff curation in the admin portal) —
 * no third-party documentation is ingested or reproduced. Without an
 * Anthropic key the KB still serves, so the feature degrades gracefully.
 */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, Prisma } from "@eyf/db";
import { answerTechQuestion } from "../services/anthropic.js";

type Match = {
  id: string;
  question: string;
  answer: string;
  topic: string;
  tags: string[];
  source: string;
  reviewed: boolean;
  askCount: number;
  rank: number;
};

// Empirical (see PR): a repeat/same-concept question ranks >= 0.04 (2+ term
// hits on the OR-query below); a single accidental word overlap ranks ~0.02.
const HIT_THRESHOLD = 0.04;

async function searchKnowledge(q: string, limit = 4): Promise<Match[]> {
  // Normalize both sides identically ("Node.js" → "node js") — Postgres would
  // otherwise tokenize dotted names as single lexemes and never match. OR the
  // terms so partial overlap still retrieves; the rank threshold decides hits.
  const words = q.replace(/[^a-zA-Z0-9\s]/g, " ").toLowerCase().split(/\s+/).filter((w) => w.length > 1).slice(0, 12);
  if (words.length === 0) return [];
  const tsq = words.join(" | ");
  try {
    return await prisma.$queryRaw<Match[]>(Prisma.sql`
      SELECT id, question, answer, topic, tags, source, reviewed, "askCount",
             ts_rank(to_tsvector('english', regexp_replace(question, '[^a-zA-Z0-9 ]', ' ', 'g')), to_tsquery('english', ${tsq})) AS rank
      FROM knowledge_entries
      WHERE active = true
        AND to_tsvector('english', regexp_replace(question || ' ' || answer, '[^a-zA-Z0-9 ]', ' ', 'g')) @@ to_tsquery('english', ${tsq})
      ORDER BY rank DESC, "askCount" DESC
      LIMIT ${limit}
    `);
  } catch {
    return []; // an FTS syntax edge case must never break asking
  }
}

const publicEntry = (m: { id: string; question: string; answer: string; topic: string; tags: string[]; source: string; reviewed: boolean }) => ({
  id: m.id, question: m.question, answer: m.answer, topic: m.topic, tags: m.tags,
  curated: m.source === "STAFF" || m.reviewed,
});

export async function askRoutes(app: FastifyInstance) {
  // Trending — most-asked answers, for the empty state.
  app.get("/trending", { preHandler: app.requireAuth }, async () => {
    const rows = await prisma.knowledgeEntry.findMany({
      where: { active: true },
      orderBy: [{ askCount: "desc" }, { createdAt: "desc" }],
      take: 8,
      select: { id: true, question: true, topic: true, askCount: true },
    });
    return { success: true, data: rows };
  });

  // Full entry by id (for opening a trending/related question).
  app.get("/entry/:id", { preHandler: app.requireAuth }, async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const row = await prisma.knowledgeEntry.findFirst({ where: { id, active: true } });
    if (!row) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Answer not found." } });
    await prisma.knowledgeEntry.update({ where: { id }, data: { askCount: { increment: 1 } } }).catch(() => undefined);
    return { success: true, data: publicEntry(row) };
  });

  app.post("/", { preHandler: app.requireAuth }, async (req, reply) => {
    const { question } = z.object({ question: z.string().trim().min(8).max(300) }).parse(req.body);

    const matches = await searchKnowledge(question);
    const top = matches[0];

    // A close existing answer — serve EYF's own corpus, no AI call needed.
    if (top && top.rank >= HIT_THRESHOLD) {
      await prisma.knowledgeEntry.update({ where: { id: top.id }, data: { askCount: { increment: 1 } } }).catch(() => undefined);
      return {
        success: true,
        data: {
          entry: publicEntry(top),
          related: matches.slice(1, 4).map(publicEntry),
          answeredBy: "knowledge-base" as const,
        },
      };
    }

    // New question — EYF Intelligence writes an original answer and it joins the KB.
    let generated: { answer: string; topic: string; tags: string[] };
    try {
      generated = await answerTechQuestion({ question });
    } catch (err) {
      req.log.warn({ err }, "ask: AI unavailable");
      // Graceful degrade: no error envelope (the client would lose `related`) —
      // the KB's closest answers are still a useful response.
      return {
        success: true,
        data: {
          entry: null,
          related: matches.slice(0, 4).map(publicEntry),
          answeredBy: "unavailable" as const,
        },
      };
    }

    const entry = await prisma.knowledgeEntry.create({
      data: { question, answer: generated.answer, topic: generated.topic, tags: generated.tags },
    });

    return {
      success: true,
      data: {
        entry: publicEntry(entry),
        related: matches.slice(0, 3).map(publicEntry),
        answeredBy: "ai" as const,
      },
    };
  });
}
