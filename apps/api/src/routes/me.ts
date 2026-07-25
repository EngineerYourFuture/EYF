import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, Persona, PlacementSource } from "@eyf/db";
import { collegeSlug, validateSelfReport, descriptiveCohortProof, READINESS_ALGO_VERSION, type ProofRow } from "@eyf/types";
import {
  getOrCreateReferralCode, settleReferralFor, validateRedeem,
  REWARD_DAYS, QUALIFY_XP, type RedeemCheck,
} from "../services/referral.js";
import { parentDigestFor } from "../services/parent-digest.js";
import { computeUserReadiness } from "../services/guidance.js";

function redeemError(reason: Exclude<RedeemCheck, { ok: true }>["reason"]): string {
  switch (reason) {
    case "unknown-code": return "That referral code isn't valid.";
    case "self": return "You can't redeem your own referral code.";
    case "already-referred": return "You've already redeemed a referral.";
    case "not-new": return "Referrals are for new members — you're already past the welcome window.";
  }
}

const profileSelect = {
  id: true,
  email: true,
  phone: true,
  name: true,
  college: true,
  graduationYear: true,
  targetRole: true,
  persona: true,
  role: true,
  emailVerifiedAt: true,
  phoneVerifiedAt: true,
  createdAt: true,
  profile: true,
  subscription: {
    select: {
      plan: true,
      status: true,
      startedAt: true,
      endsAt: true,
      intervalMonths: true,
    },
  },
} as const;

export async function meRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: app.requireAuth }, async (req) => {
    // Explicit select — never ship clerkId, deletedAt, or razorpay ids to the client.
    const user = await prisma.user.findUnique({
      where: { id: req.session!.id },
      select: profileSelect,
    });
    return { success: true, data: { user } };
  });

  // Update editable profile fields (name, college, graduation year, target role).
  // Used by the onboarding flow and the settings page.
  app.patch("/", { preHandler: app.requireAuth }, async (req) => {
    const body = z
      .object({
        name: z.string().trim().min(1).max(80).optional(),
        college: z.string().trim().max(120).nullish(),
        graduationYear: z.coerce.number().int().min(2000).max(2100).nullish(),
        targetRole: z.string().trim().max(80).nullish(),
        persona: z.nativeEnum(Persona).nullish(),
      })
      .parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.session!.id },
      data: body,
      select: profileSelect,
    });
    return { success: true, data: { user } };
  });

  // ─── GDPR / DPDP: data portability (Right of Access) ────────────
  // Returns a machine-readable copy of the personal data we hold for the caller.
  app.get("/export", { preHandler: app.requireAuth }, async (req, reply) => {
    const id = req.session!.id;
    const [user, profile, submissions, subscription, sessions] = await Promise.all([
      prisma.user.findUnique({ where: { id }, select: profileSelect }),
      prisma.userProfile.findUnique({ where: { userId: id } }),
      prisma.problemSolution.findMany({ where: { userId: id }, select: { problemId: true, verdict: true, language: true, submittedAt: true } }),
      prisma.subscription.findUnique({ where: { userId: id }, select: { plan: true, status: true, startedAt: true, endsAt: true } }),
      prisma.userSession.findMany({ where: { userId: id }, select: { userAgent: true, ip: true, createdAt: true, lastSeenAt: true } }),
    ]);
    reply.header("content-disposition", `attachment; filename="eyf-data-export-${id}.json"`);
    return reply.send({
      success: true,
      data: { exportedAt: new Date().toISOString(), user, profile, subscription, submissions, sessions },
    });
  });

  // ─── GDPR / DPDP: Right to Erasure ──────────────────────────────
  // Soft-deletes the account and evicts all sessions immediately. PII is purged
  // on the retention schedule (see docs). Requires typing the exact confirmation.
  app.post("/delete", { preHandler: app.requireAuth }, async (req, reply) => {
    z.object({ confirm: z.literal("DELETE") }).parse(req.body);
    const id = req.session!.id;
    await prisma.$transaction([
      prisma.user.update({ where: { id }, data: { deletedAt: new Date() } }),
      prisma.userSession.deleteMany({ where: { userId: id } }),
    ]);
    return reply.send({ success: true, data: { deleted: true } });
  });

  // ── Referral engine ("bring a friend, both get Pro") ──────────────
  // The caller's own code + stats. Settling on read self-heals the caller's
  // reward when they (as a referee) have just crossed the activity bar — no cron
  // needed for v1.
  app.get("/referral", { preHandler: app.requireAuth }, async (req) => {
    const uid = req.session!.id;
    await settleReferralFor(uid).catch(() => {});
    const [code, made] = await Promise.all([
      getOrCreateReferralCode(uid),
      prisma.referral.findMany({ where: { referrerId: uid }, select: { status: true } }),
    ]);
    const qualified = made.filter((r) => r.status === "REWARDED").length;
    return {
      success: true,
      data: {
        code,
        path: `/?ref=${code}`,
        rewardDays: REWARD_DAYS,
        qualifyXp: QUALIFY_XP,
        stats: { invited: made.length, qualified, daysEarned: qualified * REWARD_DAYS },
      },
    };
  });

  // A new member redeems a friend's code. Records a PENDING referral; the reward
  // pays out later when this member does real activity (see settleReferralFor).
  app.post("/referral/redeem", { preHandler: app.requireAuth }, async (req, reply) => {
    const { code } = z.object({ code: z.string().trim().min(1).max(16) }).parse(req.body);
    const uid = req.session!.id;
    const [referrer, existing, profile] = await Promise.all([
      prisma.user.findUnique({ where: { referralCode: code.toUpperCase() }, select: { id: true } }),
      prisma.referral.findUnique({ where: { refereeId: uid }, select: { id: true } }),
      prisma.userProfile.findUnique({ where: { userId: uid }, select: { currentXp: true } }),
    ]);
    const check = validateRedeem({
      refereeId: uid,
      referrerId: referrer?.id ?? null,
      refereeAlreadyReferred: !!existing,
      refereeXp: profile?.currentXp ?? 0,
    });
    if (!check.ok) {
      return reply.code(400).send({ success: false, error: { code: "REFERRAL_INVALID", message: redeemError(check.reason) } });
    }
    await prisma.referral.create({ data: { referrerId: referrer!.id, refereeId: uid, rewardDays: REWARD_DAYS } });
    return { success: true, data: { redeemed: true, rewardDays: REWARD_DAYS, qualifyXp: QUALIFY_XP } };
  });

  // ── Parent progress digest (opt-in) ───────────────────────────────
  // Set (or clear, with null/empty) the parent email that receives the weekly
  // digest. Presence of the email = opted in.
  app.post("/parent-email", { preHandler: app.requireAuth }, async (req) => {
    const { email } = z.object({ email: z.string().email().nullish().or(z.literal("")) }).parse(req.body);
    const parentEmail = email && email.length > 0 ? email : null;
    await prisma.user.update({ where: { id: req.session!.id }, data: { parentEmail } });
    return { success: true, data: { parentEmail } };
  });

  // Preview the digest the parent would receive this week, plus the opt-in state.
  app.get("/parent-digest", { preHandler: app.requireAuth }, async (req) => {
    const [me, digest] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.session!.id }, select: { parentEmail: true } }),
      parentDigestFor(req.session!.id),
    ]);
    return { success: true, data: { parentEmail: me?.parentEmail ?? null, digest } };
  });

  // ── Proof Loop: self-reported placements (docs/PLAN-proof-loop.md, S6) ──────
  // The bootstrap for outcomes that happen OUTSIDE EYF's pipeline (most early
  // placements). Always stored UNVERIFIED — the verified/self-report trust
  // boundary keeps these out of every money aggregate until an offer letter
  // confirms them. Requires explicit DPDP consent (financial PII).
  app.get("/placements", { preHandler: app.requireAuth }, async (req) => {
    const rows = await prisma.placementOutcome.findMany({
      where: { userId: req.session!.id, source: PlacementSource.SELF_REPORT },
      select: { id: true, companyName: true, role: true, ctcInr: true, status: true, verifiedAt: true, placedAt: true },
      orderBy: { placedAt: "desc" },
    });
    return { success: true, data: rows.map((r) => ({ ...r, verified: r.verifiedAt != null })) };
  });

  app.post("/placements", { preHandler: app.requireAuth }, async (req, reply) => {
    const body = z.object({
      companyName: z.string(),
      role: z.string(),
      ctcInr: z.number().int().nullish(),
      status: z.enum(["OFFERED", "JOINED"]).optional(),
      consent: z.boolean(),
    }).parse(req.body ?? {});

    const check = validateSelfReport(body);
    if (!check.ok) {
      const messages: Record<string, string> = {
        "no-consent": "We need your consent to store your placement details.",
        "bad-ctc": "That package figure doesn't look right.",
      };
      const msg = messages[check.reason] ?? "Add the company and role.";
      return reply.code(400).send({ success: false, error: { code: "SELF_REPORT_INVALID", message: msg, details: { reason: check.reason } } });
    }

    // Snapshot readiness now — user-initiated and off any hot path, so the one
    // compute is fine. Frozen + versioned so calibration never crosses algorithm changes.
    const [user, { readiness }] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.session!.id }, select: { college: true } }),
      computeUserReadiness(req.session!.id),
    ]);

    const created = await prisma.placementOutcome.create({
      data: {
        userId: req.session!.id,
        source: PlacementSource.SELF_REPORT,
        status: check.value.status,
        companyName: check.value.companyName,
        role: check.value.role,
        ctcInr: check.value.ctcInr,
        verifiedAt: null, // self-reports are never verified — stays out of money stats
        readinessOverall: readiness.overall,
        readinessBand: readiness.band,
        snapshotVersion: READINESS_ALGO_VERSION,
        snapshot: { readiness: readiness.overall, band: readiness.band, at: new Date().toISOString() },
        collegeSlug: collegeSlug(user?.college ?? null),
      },
      select: { id: true, companyName: true, role: true, status: true },
    });
    return reply.code(201).send({ success: true, data: { ...created, verified: false } });
  });

  // Student-facing proof: what verified alumni from THIS student's college achieved.
  // Aggregate-only and k-floored (descriptiveCohortProof) so it never exposes an
  // individual, and strictly descriptive/past-tense — proof as hope, not a promise.
  app.get("/placement-proof", { preHandler: app.requireAuth }, async (req) => {
    const me = await prisma.user.findUnique({ where: { id: req.session!.id }, select: { college: true } });
    if (!me?.college) return { success: true, data: { college: null, proof: null } };
    const outcomes = await prisma.placementOutcome.findMany({
      where: { collegeSlug: collegeSlug(me.college) },
      select: { companyName: true, ctcInr: true, status: true, verifiedAt: true },
    });
    const rows: ProofRow[] = outcomes.map((o) => ({
      companyName: o.companyName,
      ctcInr: o.ctcInr,
      status: o.status,
      verified: o.verifiedAt != null,
    }));
    return { success: true, data: { college: me.college, proof: descriptiveCohortProof(rows) } };
  });
}
