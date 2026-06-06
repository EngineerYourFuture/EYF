import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, MockType } from "@eyf/db";
import { joinOrMatch, leaveQueue, checkMatch } from "../services/peer-matching.js";
import { sendSignal, nextSignal, drain, type SignalKind } from "../services/peer-signal.js";

export async function peerRoutes(app: FastifyInstance) {
  // Peer mocks are a Basic+ feature (AI mocks are Pro+). Gate at queue entry;
  // the signaling endpoints below operate on an already-matched session.
  app.post("/queue/join", { preHandler: [app.requireAuth, app.requirePlan(["basic"])] }, async (req) => {
    const { problemFocus } = z.object({ problemFocus: z.string().optional() }).parse(req.body);
    const result = await joinOrMatch({ userId: req.session!.id, problemFocus });
    return { success: true, data: result };
  });

  app.post("/queue/leave", { preHandler: app.requireAuth }, async (req) => {
    await leaveQueue(req.session!.id);
    return { success: true, data: { ok: true } };
  });

  app.get("/queue/status", { preHandler: app.requireAuth }, async (req) => {
    const result = await checkMatch(req.session!.id);
    return { success: true, data: result };
  });

  // ── WebRTC signaling ────────────────────────────────────────────
  app.post("/:mockId/signal", { preHandler: app.requireAuth }, async (req, reply) => {
    const { mockId } = z.object({ mockId: z.string() }).parse(req.params);
    const body = z.object({
      kind: z.enum(["offer", "answer", "ice", "bye"]) as z.ZodType<SignalKind>,
      payload: z.unknown(),
    }).parse(req.body);

    const mock = await prisma.mockSession.findUnique({ where: { id: mockId } });
    if (!mock || mock.type !== MockType.PEER) {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Peer mock not found" } });
    }
    const me = req.session!.id;
    const peer = mock.candidateId === me ? mock.peerId : mock.candidateId;
    if (!peer || (mock.candidateId !== me && mock.peerId !== me)) {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Not in this mock" } });
    }
    await sendSignal(mockId, peer, { from: me, kind: body.kind, payload: body.payload, ts: Date.now() });
    return { success: true, data: { sent: true } };
  });

  // Long-poll for inbound signals.
  app.get("/:mockId/signal", { preHandler: app.requireAuth }, async (req, reply) => {
    const { mockId } = z.object({ mockId: z.string() }).parse(req.params);
    const mock = await prisma.mockSession.findUnique({ where: { id: mockId } });
    if (!mock || (mock.candidateId !== req.session!.id && mock.peerId !== req.session!.id)) {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Mock not found" } });
    }
    const env = await nextSignal(mockId, req.session!.id, 25);
    return { success: true, data: env };
  });

  app.post("/:mockId/leave", { preHandler: app.requireAuth }, async (req) => {
    const { mockId } = z.object({ mockId: z.string() }).parse(req.params);
    await drain(mockId, req.session!.id);
    return { success: true, data: { ok: true } };
  });
}
