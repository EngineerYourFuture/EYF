import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@eyf/db";
import { anthropic, generateProblemVariant } from "../services/anthropic.js";
import { requirePermission } from "../middleware/permissions.js";

const MODEL_SONNET = "claude-sonnet-4-6";

/**
 * Editorial + variant generation. Staff-only (manage:content capability).
 * Editorial generation streams through Claude Sonnet with a fixed JSON schema.
 */
export async function editorialRoutes(app: FastifyInstance) {
  app.post(
    "/problems/:slug/generate",
    { preHandler: [app.requireAuth, requirePermission("manage:content")] },
    async (req, reply) => {
      if (!anthropic) return reply.code(503).send({ success: false, error: { code: "AI_UNAVAILABLE", message: "ANTHROPIC_API_KEY not set." } });
      const { slug } = z.object({ slug: z.string() }).parse(req.params);
      const problem = await prisma.problem.findUnique({ where: { slug } });
      if (!problem) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Problem not found" } });

      try {
        const msg = await anthropic.messages.create({
          model: MODEL_SONNET,
          max_tokens: 2000,
          system:
            "You write DSA editorials. Return ONLY JSON: { \"approach\": string, \"textSolution\": string (markdown), \"timeComplexity\": string, \"spaceComplexity\": string, \"pitfalls\": string }. textSolution should cover intuition → walk-through → why it's optimal. Be concrete, no fluff.",
          messages: [{ role: "user", content: `# ${problem.title}\n\n${problem.description}` }],
        });
        const text = msg.content.find((c) => c.type === "text")?.text ?? "";
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        if (start === -1 || end <= start) {
          throw new Error("Model returned no JSON object");
        }
        const parsed = JSON.parse(text.slice(start, end + 1)) as {
          approach: string; textSolution: string; timeComplexity: string; spaceComplexity: string; pitfalls: string;
        };
        const ed = await prisma.editorial.upsert({
          where: { problemId: problem.id },
          create: { problemId: problem.id, ...parsed },
          update: parsed,
        });
        return { success: true, data: ed };
      } catch (err) {
        req.log.error({ err }, "editorial generation failed");
        return reply.code(502).send({ success: false, error: { code: "AI_FAILED", message: "Editorial generation failed — try again." } });
      }
    },
  );

  app.post(
    "/problems/:slug/variants/generate",
    { preHandler: [app.requireAuth, requirePermission("manage:content")] },
    async (req, reply) => {
      const { slug } = z.object({ slug: z.string() }).parse(req.params);
      const problem = await prisma.problem.findUnique({ where: { slug } });
      if (!problem) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Problem not found" } });
      try {
        const v = await generateProblemVariant({ title: problem.title, description: problem.description });
        const variant = await prisma.problemVariant.create({
          data: { problemId: problem.id, ...v },
        });
        return { success: true, data: variant };
      } catch (err) {
        req.log.error({ err }, "variant generation failed");
        return reply.code(503).send({ success: false, error: { code: "AI_FAILED", message: (err as Error).message } });
      }
    },
  );

  app.get("/problems/:slug/editorial", { preHandler: app.requireAuth }, async (req, reply) => {
    const { slug } = z.object({ slug: z.string() }).parse(req.params);
    const ed = await prisma.editorial.findFirst({ where: { problem: { slug } } });
    if (!ed) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "No editorial yet." } });
    if (req.session!.plan === "free") {
      return reply.code(402).send({ success: false, error: { code: "PLAN_UPGRADE_REQUIRED", message: "Editorials are Basic+.", upgradeRequired: true, plan: "basic" } });
    }
    return { success: true, data: ed };
  });

  app.get("/problems/:slug/variants", { preHandler: app.requireAuth }, async (req, reply) => {
    const { slug } = z.object({ slug: z.string() }).parse(req.params);
    const variants = await prisma.problemVariant.findMany({
      where: { problem: { slug } },
      orderBy: { createdAt: "desc" },
    });
    void reply;
    return { success: true, data: variants };
  });
}
