import type { FastifyInstance } from "fastify";
import { getDailyMission, claimDailyMission } from "../services/missions.js";

export async function missionRoutes(app: FastifyInstance) {
  app.get("/today", { preHandler: app.requireAuth }, async (req) => {
    const mission = await getDailyMission(req.session!.id);
    return { success: true, data: mission };
  });

  app.post("/claim", { preHandler: app.requireAuth }, async (req, reply) => {
    const result = await claimDailyMission(req.session!.id);
    if (!result.claimed) {
      return reply.code(result.reason === "incomplete" ? 400 : 409).send({
        success: false,
        error: {
          code: result.reason === "incomplete" ? "MISSION_INCOMPLETE" : "ALREADY_CLAIMED",
          message: result.reason === "incomplete"
            ? "Finish all three tasks to claim your bonus."
            : "You've already claimed today's mission bonus.",
        },
      });
    }
    return { success: true, data: result };
  });
}
