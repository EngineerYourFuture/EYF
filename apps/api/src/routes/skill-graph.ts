import type { FastifyInstance } from "fastify";
import { computeSkillGraph } from "../services/skill-graph.js";

export async function skillGraphRoutes(app: FastifyInstance) {
  app.get("/me", { preHandler: app.requireAuth }, async (req) => {
    const graph = await computeSkillGraph(req.session!.id);
    return { success: true, data: graph };
  });
}
