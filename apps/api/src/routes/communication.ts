import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, CommunicationKind } from "@eyf/db";
import {
  COMMUNICATION_KINDS,
  promptsByKind,
  getPrompt,
} from "../lib/communication-bank.js";
import { gradeCommunicationAnswer } from "../services/communication.js";
import { transcribeAudio } from "../services/whisper.js";

export async function communicationRoutes(app: FastifyInstance) {
  // Prompt catalog — kinds + prompts (public so the picker renders instantly).
  app.get("/prompts", async () => ({
    success: true,
    data: {
      kinds: COMMUNICATION_KINDS,
      prompts: promptsByKind().map((p) => ({ id: p.id, kind: p.kind, question: p.question, tip: p.tip })),
    },
  }));

  // Transcribe a recorded answer (Basic+). Client sends the raw audio blob.
  app.post(
    "/transcribe",
    {
      preHandler: [app.requireAuth, app.requirePlan(["basic"])],
      bodyLimit: 25 * 1024 * 1024,
    },
    async (req, reply) => {
      const audio = req.body as Buffer | undefined;
      if (!audio || !Buffer.isBuffer(audio)) {
        return reply.code(400).send({
          success: false,
          error: { code: "MISSING_AUDIO", message: "Send the audio blob as the request body." },
        });
      }
      const lang = z.object({ lang: z.string().min(2).max(5).optional() }).parse(req.query).lang;
      try {
        const result = await transcribeAudio({
          audio,
          mimeType: (req.headers["content-type"] as string) ?? "audio/webm",
          language: lang ?? "en",
        });
        return { success: true, data: { text: result.text, durationSeconds: result.durationSeconds } };
      } catch (err) {
        req.log.error({ err }, "communication transcription failed");
        return reply.code(503).send({
          success: false,
          error: { code: "TRANSCRIPTION_FAILED", message: (err as Error).message },
        });
      }
    },
  );

  // Grade an answer (Basic+). Persists the drill and returns full feedback.
  app.post(
    "/feedback",
    { preHandler: [app.requireAuth, app.requirePlan(["basic"])] },
    async (req, reply) => {
      const body = z.object({
        promptId: z.string(),
        transcript: z.string().min(1).max(6000),
        durationSeconds: z.number().int().min(0).max(1800).default(0),
      }).parse(req.body);

      const prompt = getPrompt(body.promptId);
      if (!prompt) {
        return reply.code(404).send({
          success: false,
          error: { code: "PROMPT_NOT_FOUND", message: "That prompt doesn't exist." },
        });
      }

      let feedback;
      try {
        feedback = await gradeCommunicationAnswer({ prompt, transcript: body.transcript });
      } catch (err) {
        req.log.error({ err }, "communication grading failed");
        return reply.code(503).send({
          success: false,
          error: { code: "AI_UNAVAILABLE", message: "The communication coach isn't configured yet." },
        });
      }

      const drill = await prisma.communicationDrill.create({
        data: {
          userId: req.session!.id,
          promptId: prompt.id,
          kind: prompt.kind as CommunicationKind,
          transcript: body.transcript,
          score: Math.round(feedback.overallScore),
          feedback,
          durationSeconds: body.durationSeconds,
        },
      });

      return { success: true, data: { drillId: drill.id, feedback } };
    },
  );

  // History — recent drills for the progress view.
  app.get("/history", { preHandler: app.requireAuth }, async (req) => {
    const drills = await prisma.communicationDrill.findMany({
      where: { userId: req.session!.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, promptId: true, kind: true, score: true, durationSeconds: true, createdAt: true },
    });
    const best: Partial<Record<string, number>> = {};
    for (const d of drills) best[d.kind] = Math.max(best[d.kind] ?? 0, d.score);
    return { success: true, data: { drills, bestByKind: best } };
  });
}
