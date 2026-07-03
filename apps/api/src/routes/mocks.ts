import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, MockType, MockStatus } from "@eyf/db";
import { startMockSession, nextTurn, gradeMockSession, type Turn } from "../services/ai-mock.js";
import { transcribeAudio } from "../services/whisper.js";

export async function mockRoutes(app: FastifyInstance) {
  app.get("/me", { preHandler: app.requireAuth }, async (req) => {
    const list = await prisma.mockSession.findMany({
      where: { candidateId: req.session!.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return { success: true, data: list };
  });

  // Composure trend — the Mock Interviews differentiator. Others record/playback
  // a mock; EYF trends how you HANDLE PRESSURE over weeks. Composure = the
  // approach-clarity + communication rubric dims (how you carry yourself),
  // separate from raw technical scores.
  app.get("/composure", { preHandler: app.requireAuth }, async (req) => {
    const sessions = await prisma.mockSession.findMany({
      where: { candidateId: req.session!.id, feedback: { not: undefined } },
      orderBy: { createdAt: "asc" },
      select: { company: true, createdAt: true, endedAt: true, feedback: true },
    });

    const series = sessions
      .map((s) => {
        const f = s.feedback as { overallScore?: number; rubric?: { approachClarity?: number; communication?: number } } | null;
        if (!f) return null;
        const r = f.rubric ?? {};
        const clarity = r.approachClarity ?? f.overallScore ?? 0;
        const comm = r.communication ?? f.overallScore ?? 0;
        const composure = Math.round((clarity + comm) / 2);
        if (composure <= 0) return null;
        return { date: (s.endedAt ?? s.createdAt).toISOString().slice(0, 10), composure, overall: f.overallScore ?? 0, company: s.company };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    const n = series.length;
    const avg = n ? Math.round(series.reduce((a, p) => a + p.composure, 0) / n) : 0;
    const first = n ? series[0]!.composure : 0;
    const last = n ? series[n - 1]!.composure : 0;
    const delta = last - first;
    const best = n ? Math.max(...series.map((p) => p.composure)) : 0;
    const trend = n < 2 ? "new" : delta >= 5 ? "improving" : delta <= -5 ? "declining" : "steady";
    return { success: true, data: { series, sessions: n, avg, best, delta, trend } };
  });

  app.get("/:id", { preHandler: app.requireAuth }, async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const m = await prisma.mockSession.findFirst({ where: { id, candidateId: req.session!.id } });
    if (!m) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Mock not found" } });
    return { success: true, data: m };
  });

  // AI mock: Pro+ per spec. Creates session + first interviewer message.
  app.post(
    "/ai/start",
    { preHandler: [app.requireAuth, app.requirePlan(["pro", "elite"])] },
    async (req, reply) => {
      const body = z.object({
        company: z.string().optional(),
        problemFocus: z.string().optional(),
        durationMin: z.number().int().min(15).max(90).default(45),
      }).parse(req.body);
      try {
        const kickoff = await startMockSession({
          candidateName: req.session!.name,
          company: body.company,
          problemFocus: body.problemFocus,
        });
        const transcript: Turn[] = [{ role: "assistant", content: kickoff.greeting, ts: Date.now() }];
        const session = await prisma.mockSession.create({
          data: {
            type: MockType.AI,
            status: MockStatus.IN_PROGRESS,
            candidateId: req.session!.id,
            company: body.company ?? null,
            problemFocus: body.problemFocus ?? null,
            durationMin: body.durationMin,
            scheduledFor: new Date(),
            startedAt: new Date(),
            transcript,
          },
        });
        return { success: true, data: session };
      } catch (err) {
        req.log.error({ err }, "ai mock start failed");
        return reply.code(503).send({
          success: false,
          error: { code: "AI_UNAVAILABLE", message: "AI interviewer not configured." },
        });
      }
    },
  );

  app.post(
    "/:id/turn",
    { preHandler: [app.requireAuth, app.requirePlan(["pro", "elite"])] },
    async (req, reply) => {
      const { id } = z.object({ id: z.string() }).parse(req.params);
      const { message } = z.object({ message: z.string().min(1).max(4000) }).parse(req.body);
      const session = await prisma.mockSession.findFirst({
        where: { id, candidateId: req.session!.id, type: MockType.AI },
      });
      if (!session) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Mock not found" } });
      if (session.status !== MockStatus.IN_PROGRESS) {
        return reply.code(400).send({ success: false, error: { code: "MOCK_ENDED", message: "Mock already ended." } });
      }

      const history: Turn[] = [...(session.transcript as unknown as Turn[]), { role: "user", content: message, ts: Date.now() }];
      const reply_ = await nextTurn({
        candidateName: req.session!.name,
        company: session.company ?? undefined,
        problemFocus: session.problemFocus ?? undefined,
        history,
      });
      const updated: Turn[] = [...history, { role: "assistant", content: reply_, ts: Date.now() }];
      await prisma.mockSession.update({
        where: { id },
        data: { transcript: updated },
      });
      return { success: true, data: { reply: reply_ } };
    },
  );

  app.post(
    "/:id/end",
    { preHandler: [app.requireAuth, app.requirePlan(["pro", "elite"])] },
    async (req, reply) => {
      const { id } = z.object({ id: z.string() }).parse(req.params);
      // AI-only: expert/peer mocks settle via the mentor route, not here.
      const session = await prisma.mockSession.findFirst({
        where: { id, candidateId: req.session!.id, type: MockType.AI },
      });
      if (!session) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "AI mock not found" } });
      let feedback = null;
      try {
        feedback = await gradeMockSession((session.transcript as unknown as Turn[]) ?? []);
      } catch (err) {
        req.log.error({ err }, "grading failed");
      }
      const ended = await prisma.mockSession.update({
        where: { id },
        data: {
          status: MockStatus.COMPLETED,
          endedAt: new Date(),
          feedback: feedback ?? undefined,
        },
      });
      return { success: true, data: ended };
    },
  );

  // Voice transcription endpoint. Accepts a raw audio body (audio/webm typically).
  // Returns the transcript; the client then POSTs it to /:id/turn as a normal message.
  app.post(
    "/:id/transcribe",
    {
      preHandler: [app.requireAuth, app.requirePlan(["pro", "elite"])],
      bodyLimit: 25 * 1024 * 1024, // 25MB to match Whisper's input limit
    },
    async (req, reply) => {
      const { id } = z.object({ id: z.string() }).parse(req.params);
      const session = await prisma.mockSession.findFirst({
        where: { id, candidateId: req.session!.id, type: MockType.AI },
      });
      if (!session) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Mock not found" } });

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
        req.log.error({ err }, "whisper transcription failed");
        return reply.code(503).send({
          success: false,
          error: { code: "TRANSCRIPTION_FAILED", message: (err as Error).message },
        });
      }
    },
  );
}
