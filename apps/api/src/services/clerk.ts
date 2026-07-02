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
