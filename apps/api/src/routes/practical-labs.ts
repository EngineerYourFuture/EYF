import type { FastifyInstance } from "fastify";
import { prisma } from "@eyf/db";
import { SQL_LABS, ensureSqlLabs } from "../services/practical-labs.js";
import { testSuiteHash } from "../services/test-suite.js";
export async function practicalLabsRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: app.requireAuth }, async (req) => {
    const accepted = await prisma.problemSolution.findMany({ where: { userId: req.session!.id, verdict: "ACCEPTED", problem: { slug: { in: SQL_LABS.map((l) => l.slug) } } }, select: { problem: { select: { slug: true } }, testSuiteHash: true, passedTests: true, totalTests: true } });
    return { success: true, data: SQL_LABS.map((l) => ({ slug: l.slug, title: l.title, summary: l.summary, tests: l.tests.length, language: "SQL", completed: accepted.some((s) => s.problem.slug === l.slug && s.testSuiteHash === testSuiteHash(l.tests) && s.passedTests === l.tests.length && s.totalTests === l.tests.length) })) };
  });
  app.post("/prepare", { preHandler: app.requireAuth }, async () => { await ensureSqlLabs(); return { success: true, data: { ready: true } }; });
}
