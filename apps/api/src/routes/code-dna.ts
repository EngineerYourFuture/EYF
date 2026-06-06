import type { FastifyInstance } from "fastify";
import { computeCodeDna } from "../services/code-dna.js";
import { generateStrategy } from "../services/strategist.js";

export async function codeDnaRoutes(app: FastifyInstance) {
  app.get("/me", { preHandler: app.requireAuth }, async (req) => {
    const dna = await computeCodeDna(req.session!.id);
    return { success: true, data: dna };
  });

  app.post(
    "/strategy",
    { preHandler: [app.requireAuth, app.requirePlan(["pro", "elite"])] },
    async (req, reply) => {
      try {
        const plan = await generateStrategy(req.session!.id);
        return { success: true, data: plan };
      } catch (err) {
        req.log.error({ err }, "strategy generation failed");
        return reply.code(503).send({
          success: false,
          error: { code: "AI_UNAVAILABLE", message: "Strategy generator not configured." },
        });
      }
    },
  );
}
