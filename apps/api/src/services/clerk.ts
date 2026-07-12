import { createClerkClient, verifyToken } from "@clerk/backend";
import { env } from "../env.js";
import { prisma, Role, PlanTier } from "@eyf/db";
import { isRealClerkKey } from "./clerk-key.js";

export { isRealClerkKey };

// See clerk-key.ts: only touch Clerk when a real secret key is configured, so a
// placeholder key can't inflict a ~5s verifyToken() timeout on every authed request.
export const hasRealClerk = (): boolean => isRealClerkKey(env.CLERK_SECRET_KEY);

export const clerk = hasRealClerk()
  ? createClerkClient({ secretKey: env.CLERK_SECRET_KEY })
  : null;

export type ClerkClaims = { sub: string; email?: string; sid?: string };

export async function verifyClerkSession(token: string): Promise<ClerkClaims> {
  if (!hasRealClerk()) {
    throw new Error("Clerk not configured with a real secret key");
  }
  const payload = await verifyToken(token, { secretKey: env.CLERK_SECRET_KEY });
  return { sub: payload.sub, email: payload.email as string | undefined, sid: payload.sid as string | undefined };
}

/**
 * Fallback sync: fetch a Clerk user by id from the Backend API and upsert them.
 * Used when a valid Clerk session arrives before the user.created webhook has
 * synced the account (or in local dev, where Clerk can't reach localhost). The
 * webhook remains the primary path; this just closes the pre-sync gap so a fresh
 * signup isn't 401'd on its first authenticated request. Returns null if Clerk
 * isn't configured or the user can't be fetched.
 */
export async function ensureUserFromClerk(userId: string) {
  if (!clerk) return null;
  try {
    const cu = await clerk.users.getUser(userId);
    await upsertUserFromClerk({
      id: cu.id,
      email_addresses: cu.emailAddresses.map((e) => ({
        email_address: e.emailAddress,
        verification: { status: e.verification?.status ?? undefined },
      })),
      phone_numbers: cu.phoneNumbers.map((p) => ({
        phone_number: p.phoneNumber,
        verification: { status: p.verification?.status ?? undefined },
      })),
      first_name: cu.firstName,
      last_name: cu.lastName,
    });
    return prisma.user.findUnique({ where: { clerkId: userId }, include: { subscription: true } });
  } catch {
    return null;
  }
}

/**
 * Upsert an EYF user from a Clerk user.created / user.updated webhook.
 * Caller already verified the svix signature.
 */
export async function upsertUserFromClerk(payload: {
  id: string;
  email_addresses: { email_address: string; verification?: { status?: string } }[];
  phone_numbers?: { phone_number: string; verification?: { status?: string } }[];
  first_name?: string | null;
  last_name?: string | null;
}) {
  const email = payload.email_addresses[0]?.email_address;
  if (!email) throw new Error("Clerk payload missing email");
  const name = [payload.first_name, payload.last_name].filter(Boolean).join(" ") || email.split("@")[0]!;
  const phone = payload.phone_numbers?.[0]?.phone_number;
  const emailVerified = payload.email_addresses[0]?.verification?.status === "verified";
  const phoneVerified = payload.phone_numbers?.[0]?.verification?.status === "verified";

  return prisma.user.upsert({
    where: { clerkId: payload.id },
    update: {
      email,
      name,
      phone,
      emailVerifiedAt: emailVerified ? new Date() : null,
      phoneVerifiedAt: phoneVerified ? new Date() : null,
    },
    create: {
      clerkId: payload.id,
      email,
      name,
      phone,
      role: Role.STUDENT_FREE,
      emailVerifiedAt: emailVerified ? new Date() : null,
      phoneVerifiedAt: phoneVerified ? new Date() : null,
      profile: { create: {} },
      subscription: { create: { plan: PlanTier.FREE } },
    },
  });
}
