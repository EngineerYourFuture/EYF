import { type Prisma } from "@eyf/db";
import { canInOrg } from "@eyf/types";

export const accountError = (statusCode: number, code: string, message: string) =>
  Object.assign(new Error(message), { statusCode, code });

/** Serialize membership changes, seat admissions and license changes per tenant. */
export async function lockOrganization(tx: Prisma.TransactionClient, orgId: string) {
  await tx.$queryRaw`SELECT id FROM organizations WHERE id = ${orgId} FOR UPDATE`;
}

export async function assertMemberManager(tx: Prisma.TransactionClient, orgId: string, userId: string) {
  const actor = await tx.orgMember.findUnique({ where: { orgId_userId: { orgId, userId } } });
  if (actor?.status !== "ACTIVE") throw accountError(404, "NOT_FOUND", "Not found.");
  if (!canInOrg(actor.roles, "org:members").granted) throw accountError(403, "FORBIDDEN", "You cannot manage members.");
  return actor;
}

export async function assertSeatAvailable(tx: Prisma.TransactionClient, orgId: string) {
  const org = await tx.organization.findUniqueOrThrow({ where: { id: orgId }, select: { seatsLicensed: true } });
  const active = await tx.orgMember.count({ where: { orgId, status: "ACTIVE" } });
  if (active >= org.seatsLicensed) throw accountError(402, "SEATS_EXHAUSTED", "All licensed seats are in use. Contact your administrator to add seats.");
}
