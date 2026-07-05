/**
 * EYF Score sharing — the readiness score as a public, verifiable object.
 *
 * POST /share computes the score SERVER-SIDE (never trusts a client number)
 * and freezes it into a ScoreShare snapshot behind an unguessable code.
 * GET /verify/:code is public: anyone with the link (a recruiter, a friend)
 * sees the EYF-computed score — same trust model as certificate verification.
 */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { prisma } from "@eyf/db";
import { computeUserReadiness } from "../services/guidance.js";

// No 0/O/1/l/i — codes get read aloud and retyped.
const CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

function newCode(len = 10): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length];
  return out;
}

export type ScoreSnapshot = {
  overall: number;
  band: string;
  pillars: { key: string; label: string; score: number; weight: number }[];
  name: string;
  college: string | null;
  graduationYear: number | null;
  targetRole: string | null;
  targetCompany: string | null;
};

export async function scoreRoutes(app: FastifyInstance) {
  app.post("/share", { preHandler: app.requireAuth }, async (req) => {
    const userId = req.session!.id;
    const [{ readiness, goal }, user] = await Promise.all([
      computeUserReadiness(userId),
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, college: true, graduationYear: true, targetRole: true },
      }),
    ]);

    const snapshot: ScoreSnapshot = {
      overall: readiness.overall,
      band: readiness.band,
      pillars: readiness.pillars.map((p) => ({ key: p.key, label: p.label, score: p.score, weight: p.weight })),
      name: user?.name ?? "EYF Student",
      college: user?.college ?? null,
      graduationYear: user?.graduationYear ?? null,
      targetRole: goal?.targetRole ?? user?.targetRole ?? null,
      targetCompany: goal?.targetCompany ?? null,
    };

    const share = await prisma.scoreShare.create({
      data: { userId, code: newCode(), snapshot },
      select: { code: true, createdAt: true },
    });

    return { success: true, data: { code: share.code, issuedAt: share.createdAt, snapshot } };
  });

  // Public verification — anyone with the code can confirm the score is genuine.
  app.get("/verify/:code", async (req, reply) => {
    const { code } = z.object({ code: z.string().min(1).max(64) }).parse(req.params);
    const share = await prisma.scoreShare.findUnique({
      where: { code },
      select: { snapshot: true, createdAt: true, code: true },
    });
    if (!share) {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "No such score snapshot." } });
    }
    return { success: true, data: { snapshot: share.snapshot, issuedAt: share.createdAt, code: share.code } };
  });
}
