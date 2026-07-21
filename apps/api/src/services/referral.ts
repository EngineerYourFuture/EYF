/**
 * Referral engine — "bring a friend, both get Pro" (design: growth loop).
 *
 * Flow: a student shares their `referralCode`; a NEW student redeems it, which
 * records a PENDING Referral. When the referee does real activity (crosses the
 * XP bar), the referral is settled: both parties get `REWARD_DAYS` of promo Pro.
 *
 * Two deliberate integrity choices:
 *  - Reward is premium days, NEVER XP/score — so it can't corrupt the internship
 *    merit ranking.
 *  - You can only redeem while new (low XP) and the reward only pays after real
 *    activity — so throwaway accounts earn nothing.
 *
 * The pure functions (code gen, qualification, redeem validation) are the tested
 * core; the DB helpers below are thin glue.
 */
import { randomInt } from "node:crypto";
import { prisma, PlanTier, SubscriptionStatus, ReferralStatus } from "@eyf/db";
import { resolveActivePlan } from "../lib/subscription.js";

export const REWARD_DAYS = 14;
/** XP a referee must reach for the reward to pay out (proof of real activity). */
export const QUALIFY_XP = 100;

// Unambiguous uppercase charset (no O/0/I/1) for codes read off a screen.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** A random 8-char referral code. Collisions are astronomically unlikely but the
 * caller still upserts against a unique column and retries. */
export function newReferralCode(): string {
  // crypto-random so codes are unguessable (a guessable code could misattribute
  // a referral); also clears the pseudorandom-in-security-context lint.
  let out = "";
  for (let i = 0; i < 8; i++) out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return out;
}

/** The referee has done enough real work for the reward to be earned. */
export function qualifies(refereeXp: number): boolean {
  return refereeXp >= QUALIFY_XP;
}

export type RedeemCheck = { ok: true } | { ok: false; reason: "self" | "already-referred" | "not-new" | "unknown-code" };

/**
 * Pure guard for a redeem attempt. Keeps the anti-abuse rules in one testable
 * place: a real referrer must exist, you can't refer yourself, you can only be
 * referred once, and you must redeem while still new (XP below the qualifying
 * bar) so there's genuine activity left to earn the reward.
 */
export function validateRedeem(input: {
  refereeId: string;
  referrerId: string | null;
  refereeAlreadyReferred: boolean;
  refereeXp: number;
}): RedeemCheck {
  if (input.referrerId === null) return { ok: false, reason: "unknown-code" };
  if (input.referrerId === input.refereeId) return { ok: false, reason: "self" };
  if (input.refereeAlreadyReferred) return { ok: false, reason: "already-referred" };
  if (input.refereeXp >= QUALIFY_XP) return { ok: false, reason: "not-new" };
  return { ok: true };
}

// ─── DB glue ──────────────────────────────────────────────────────

/** The caller's shareable code, generated on first read. */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } });
  if (existing?.referralCode) return existing.referralCode;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newReferralCode();
    try {
      await prisma.user.update({ where: { id: userId }, data: { referralCode: code } });
      return code;
    } catch {
      /* c8 ignore next -- unique collision: loop and try another code. */
    }
  }
  /* c8 ignore next -- 5 collisions on an 8-char code is effectively impossible. */
  throw new Error("Could not allocate a referral code.");
}

/**
 * Grant `days` of promo Pro. Billing-safe: only touches users who are currently
 * FREE, so it can never overwrite a paid Razorpay plan (BASIC/PRO/ELITE users
 * are left untouched). Extends from any existing future endsAt.
 */
export async function grantPromoPro(userId: string, days: number): Promise<boolean> {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true, status: true, endsAt: true },
  });
  const now = new Date();
  if (resolveActivePlan(sub, now) !== PlanTier.FREE) return false;
  const base = sub?.endsAt && sub.endsAt.getTime() > now.getTime() ? sub.endsAt : now;
  const endsAt = new Date(base.getTime() + days * 86_400_000);
  await prisma.subscription.upsert({
    where: { userId },
    create: { userId, plan: PlanTier.PRO, status: SubscriptionStatus.TRIALING, endsAt, amountInr: 0 },
    update: { plan: PlanTier.PRO, status: SubscriptionStatus.TRIALING, endsAt },
  });
  return true;
}

/**
 * Settle the referee's PENDING referral if they now qualify: mark REWARDED and
 * grant both parties promo Pro. Idempotent — a no-op once already rewarded or if
 * the referee hasn't crossed the bar yet.
 */
export async function settleReferralFor(refereeId: string): Promise<boolean> {
  const referral = await prisma.referral.findUnique({ where: { refereeId } });
  if (!referral || referral.status === ReferralStatus.REWARDED) return false;
  const profile = await prisma.userProfile.findUnique({ where: { userId: refereeId }, select: { currentXp: true } });
  if (!qualifies(profile?.currentXp ?? 0)) return false;

  await prisma.referral.update({
    where: { id: referral.id },
    data: { status: ReferralStatus.REWARDED, rewardedAt: new Date() },
  });
  await Promise.all([
    grantPromoPro(referral.referrerId, referral.rewardDays),
    grantPromoPro(refereeId, referral.rewardDays),
  ]);
  return true;
}
