import type { FastifyInstance } from "fastify";
import { computeGuidance } from "../services/guidance.js";

export async function guidanceRoutes(app: FastifyInstance) {
  app.get("/me", { preHandler: app.requireAuth }, async (req) => {
    const guidance = await computeGuidance(req.session!.id);
    return { success: true, data: guidance };
  });
}
