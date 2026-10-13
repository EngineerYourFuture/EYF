import { prisma } from "@eyf/db";
import { canGrantRoles } from "@eyf/types";
import { env } from "../env.js";
import { credentialStatus } from "../lib/configuration-status.js";
import { invitationEmail, sendEmail } from "./email.js";

export type InvitationDelivery = { status: "SENT" | "FAILED" | "NOT_CONFIGURED" | "SKIPPED"; message: string };

export async function deliverInvitation(id: string, reminder = false): Promise<InvitationDelivery> {
  const now = new Date();
  const invite = await prisma.orgInvite.findUnique({ where: { id }, include: { org: { select: { name: true } } } });
  const skipped: InvitationDelivery = { status: "SKIPPED", message: "This invitation is no longer available or was emailed recently." };
  if (!invite || invite.acceptedAt || invite.expiresAt <= now || (reminder && invite.remindedAt)) return skipped;
  const inviter = await prisma.orgMember.findFirst({ where: { id: invite.invitedById, orgId: invite.orgId, status: "ACTIVE", user: { deletedAt: null } } });
  if (!inviter || !canGrantRoles(inviter.roles, invite.roles)) return skipped;
  if (credentialStatus(env.RESEND_API_KEY) !== "configured") {
    await prisma.orgInvite.updateMany({ where: { id, acceptedAt: null }, data: { emailStatus: "NOT_CONFIGURED" } });
    return { status: "NOT_CONFIGURED", message: "Email is not configured. Share the invitation code directly." };
  }
  const claim = await prisma.orgInvite.updateMany({
    where: { id, acceptedAt: null, expiresAt: { gt: now }, OR: [{ emailAttemptedAt: null }, { emailAttemptedAt: { lt: new Date(now.getTime() - 60_000) } }], ...(reminder ? { remindedAt: null } : {}) },
    data: { emailAttemptedAt: now },
  });
  if (!claim.count) return skipped;
  const result = await sendEmail({ to: invite.email, subject: reminder ? "Your EYF workspace invitation expires soon" : "Your private EYF workspace invitation", html: invitationEmail(invite.org.name, invite.token, invite.expiresAt, reminder) }, `org-invite/${id}/${now.getTime()}`);
  await prisma.orgInvite.updateMany({ where: { id, emailAttemptedAt: now }, data: { emailStatus: result.sent ? "SENT" : "FAILED", ...(result.sent ? { emailSentAt: now, ...(reminder ? { remindedAt: now } : {}) } : {}) } });
  return result.sent
    ? { status: "SENT", message: "Invitation email accepted for delivery. The code is also available to share directly." }
    : { status: "FAILED", message: "Email could not be sent. Share the invitation code directly or retry in a minute." };
}

/** One reminder near expiry, only for invitations whose first email succeeded. */
export async function remindPendingInvitations(): Promise<{ sent: number; failed: number }> {
  if (credentialStatus(env.RESEND_API_KEY) !== "configured") return { sent: 0, failed: 0 };
  const now = new Date();
  const pending = await prisma.orgInvite.findMany({ where: { acceptedAt: null, remindedAt: null, emailSentAt: { lt: new Date(now.getTime() - 86_400_000) }, expiresAt: { gt: now, lte: new Date(now.getTime() + 3 * 86_400_000) } }, select: { id: true }, take: 500, orderBy: { expiresAt: "asc" } });
  let sent = 0, failed = 0;
  for (const invite of pending) {
    try { const result = await deliverInvitation(invite.id, true); if (result.status === "SENT") sent++; else if (result.status === "FAILED") failed++; }
    catch { failed++; }
  }
  return { sent, failed };
}
