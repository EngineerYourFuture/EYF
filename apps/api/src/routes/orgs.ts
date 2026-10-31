/**
 * Enterprise org platform — Phase 0 (PRD §29 EPIC-01/03).
 * Org lifecycle, memberships, invites, departments, teams.
 *
 * Every org-scoped handler runs behind requireOrgCapability (RBAC) and then
 * filters rows by req.orgCtx (ABAC scope) — the two-step contract from §25.
 * Workflow ceremonies (role-grant hierarchy) enforced here, not in the map.
 */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { prisma, OrgRole, Prisma } from "@eyf/db";
import { canGrantRoles } from "@eyf/types";
import { requireOrgCapability, requireOrgMember } from "../middleware/org.js";
import { requirePermission } from "../middleware/permissions.js";
import { lockOrganization, accountError, assertSeatAvailable, assertMemberManager } from "../lib/org-accounts.js";
import { recordAudit } from "../lib/audit.js";
import { withOrgContext } from "../lib/org-scoped.js";
import { bumpUsage, getUsage } from "../lib/usage.js";
import { deliverInvitation } from "../services/org-invitations.js";

const rolesInput = z.array(z.nativeEnum(OrgRole)).min(1).max(5);

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "org";

export async function orgsRoutes(app: FastifyInstance) {
  // ── Org lifecycle ────────────────────────────────────────────────
  // Provisioning is a platform privilege. A normal EYF signup grants no LMS workspace.
  app.post("/", { preHandler: [app.requireAuth, requirePermission("manage:users")] }, async (req, reply) => {
    const body = z.object({ name: z.string().trim().min(2).max(80), ownerEmail: z.string().trim().email(), seatsLicensed: z.number().int().min(1).max(100000).default(10) }).strict().parse(req.body);
    const owner = await prisma.user.findFirst({ where: { email: { equals: body.ownerEmail, mode: "insensitive" }, deletedAt: null }, select: { id: true } });
    if (!owner) return reply.code(400).send({ success: false, error: { code: "OWNER_REQUIRED", message: "The owner must first create an EYF account with this email." } });
    const base = slugify(body.name);
    // Suffix on collision — slugs are public and permanent.
    let slug = base;
    let i = 2;
    while (await prisma.organization.findUnique({ where: { slug }, select: { id: true } })) {
      slug = `${base}-${i++}`;
    }
    const org = await prisma.organization.create({
      data: {
        name: body.name,
        slug,
        accessCode: randomBytes(12).toString("hex"), // legacy portal field; unused by membership flow
        seatsLicensed: body.seatsLicensed,
        members: { create: { userId: owner.id, roles: [OrgRole.OWNER] } },
      },
      select: { id: true, name: true, slug: true, plan: true, seatsLicensed: true },
    });
    await recordAudit(req, { action: "create", entity: "organization", entityId: org.id, summary: `Provisioned ${org.name} with ${org.seatsLicensed} seats` });
    return reply.code(201).send({ success: true, data: org });
  });

  // My memberships — powers the org switcher.
  app.get("/mine", { preHandler: app.requireAuth }, async (req) => {
    const memberships = await prisma.orgMember.findMany({
      where: { userId: req.session!.id, status: "ACTIVE" },
      select: {
        roles: true, joinedAt: true,
        org: { select: { id: true, name: true, slug: true, plan: true, logoUrl: true } },
      },
      orderBy: { joinedAt: "asc" },
    });
    return { success: true, data: memberships };
  });

  app.get("/:orgId", { preHandler: [app.requireAuth, requireOrgCapability("org:manage")] }, async (req) => {
    const org = await prisma.organization.findUnique({
      where: { id: req.orgCtx!.orgId },
      select: {
        id: true, name: true, slug: true, plan: true, seatsLicensed: true, logoUrl: true,
        brandColor: true, createdAt: true,
        _count: { select: { members: true, departments: true, teams: true } },
      },
    });
    return { success: true, data: org };
  });

  app.get("/:orgId/access", { preHandler: [app.requireAuth, requireOrgMember] }, async (req) => {
    const org = await prisma.organization.findUniqueOrThrow({ where: { id: req.orgCtx!.orgId }, select: { seatsLicensed: true, plan: true } });
    const used = await prisma.orgMember.count({ where: { orgId: req.orgCtx!.orgId, status: "ACTIVE" } });
    return { success: true, data: { roles: req.orgCtx!.roles, departmentId: req.orgCtx!.departmentId, seats: { used, licensed: org.seatsLicensed }, plan: org.plan } };
  });

  // Usage + seats — plan/limits surface for billing (EPIC-04).
  app.get("/:orgId/usage", { preHandler: [app.requireAuth, requireOrgCapability("org:billing")] }, async (req) => {
    const q = z.object({ period: z.string().regex(/^\d{4}-\d{2}$/).optional() }).parse(req.query);
    return { success: true, data: await getUsage(req.orgCtx!.orgId, q.period) };
  });

  // ── Members ──────────────────────────────────────────────────────
  app.get("/:orgId/members", { preHandler: [app.requireAuth, requireOrgCapability("org:members")] }, async (req) => {
    const q = z.object({
      departmentId: z.string().optional(),
      role: z.nativeEnum(OrgRole).optional(),
      cursor: z.string().optional(),
      limit: z.coerce.number().int().min(1).max(100).default(50),
    }).parse(req.query);

    // Crown-jewel people read runs inside the RLS backstop: even a future
    // regression that drops the orgId filter cannot leak another tenant.
    const members = await withOrgContext(req.orgCtx!.orgId, (tx) =>
      tx.orgMember.findMany({
        where: {
          orgId: req.orgCtx!.orgId,
          ...(q.departmentId ? { departmentId: q.departmentId } : {}),
          ...(q.role ? { roles: { has: q.role } } : {}),
          status: { not: "OFFBOARDED" },
        },
        select: {
          id: true, roles: true, title: true, status: true, joinedAt: true, departmentId: true,
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { joinedAt: "asc" },
        take: q.limit + 1,
        ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
      }),
    );
    const hasMore = members.length > q.limit;
    if (hasMore) members.pop();
    const nextCursor = hasMore ? members.at(-1)!.id : null;
    return { success: true, data: { items: members, nextCursor } };
  });

  // Change a member's roles/department — role-grant hierarchy enforced (§9).
  app.patch("/:orgId/members/:memberId", { preHandler: [app.requireAuth, requireOrgCapability("org:members")] }, async (req) => {
    const { memberId } = req.params as { memberId: string };
    const body = z.object({
      roles: rolesInput.optional(),
      departmentId: z.string().nullable().optional(),
      title: z.string().max(80).nullable().optional(),
      status: z.enum(["ACTIVE", "SUSPENDED", "OFFBOARDED"]).optional(),
    }).parse(req.body);

    const updated = await prisma.$transaction(async (tx) => {
      const orgId = req.orgCtx!.orgId;
      await lockOrganization(tx, orgId);
      const actor = await assertMemberManager(tx, orgId, req.session!.id);
      const target = await tx.orgMember.findFirst({ where: { id: memberId, orgId } });
      if (!target) throw accountError(404, "NOT_FOUND", "Member not found.");
      if (!canGrantRoles(actor.roles, [...target.roles, ...(body.roles ?? [])])) {
        throw accountError(403, "FORBIDDEN", "Your role cannot change this member or grant these roles.");
      }
      if (target.status === "ACTIVE" && target.roles.includes(OrgRole.OWNER)
        && ((body.status && body.status !== "ACTIVE") || (body.roles && !body.roles.includes(OrgRole.OWNER)))) {
        const owners = await tx.orgMember.count({ where: { orgId, status: "ACTIVE", roles: { has: OrgRole.OWNER } } });
        if (owners <= 1) throw accountError(400, "LAST_OWNER", "Keep at least one active owner.");
      }
      if (body.status === "ACTIVE" && target.status !== "ACTIVE") await assertSeatAvailable(tx, orgId);
      if (body.departmentId && !await tx.department.findFirst({ where: { id: body.departmentId, orgId }, select: { id: true } })) {
        throw accountError(400, "VALIDATION", "Department not in this organization.");
      }
      return tx.orgMember.update({ where: { id: memberId }, data: body });
    });
    await recordAudit(req, { action: "update", entity: "org-member", entityId: updated.id, summary: `Org ${req.orgCtx!.orgId}: roles ${updated.roles.join(",")}; status ${updated.status}` });
    return { success: true, data: updated };
  });

  // ── Invites ──────────────────────────────────────────────────────
  app.post("/:orgId/invites", { preHandler: [app.requireAuth, requireOrgCapability("org:members")] }, async (req, reply) => {
    const body = z.object({ email: z.string().email(), roles: rolesInput.default([OrgRole.MEMBER]) }).parse(req.body);
    if (!canGrantRoles(req.orgCtx!.roles, body.roles)) {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only the owner can invite ADMIN/OWNER." } });
    }
    // Seat cap — soft business rule from §23.
    const [org, activeCount] = await Promise.all([
      prisma.organization.findUnique({ where: { id: req.orgCtx!.orgId }, select: { seatsLicensed: true } }),
      prisma.orgMember.count({ where: { orgId: req.orgCtx!.orgId, status: "ACTIVE" } }),
    ]);
    if (org && activeCount >= org.seatsLicensed) {
      return reply.code(402).send({ success: false, error: { code: "SEATS_EXHAUSTED", message: "All licensed seats are in use. Add seats in billing." } });
    }
    const invite = await prisma.orgInvite.create({
      data: {
        orgId: req.orgCtx!.orgId,
        email: body.email.toLowerCase(),
        roles: body.roles,
        token: randomBytes(24).toString("base64url"),
        invitedById: req.orgCtx!.memberId,
        expiresAt: new Date(Date.now() + 7 * 86_400_000),
      },
      select: { id: true, email: true, roles: true, token: true, expiresAt: true },
    });
    await bumpUsage(req.orgCtx!.orgId, "invites_sent");
    await recordAudit(req, { action: "create", entity: "org-invite", entityId: invite.id, summary: `Invited ${body.email} → ${body.roles.join(",")}` });
    const delivery = await deliverInvitation(invite.id);
    return reply.code(201).send({ success: true, data: { ...invite, delivery } });
  });

  app.get("/:orgId/invites", { preHandler: [app.requireAuth, requireOrgCapability("org:members")] }, async (req) => ({
    success: true, data: await prisma.orgInvite.findMany({ where: { orgId: req.orgCtx!.orgId, acceptedAt: null, expiresAt: { gt: new Date() } }, select: { id: true, email: true, roles: true, expiresAt: true, emailStatus: true, emailSentAt: true }, orderBy: { createdAt: "desc" } }),
  }));
  app.delete("/:orgId/invites/:inviteId", { preHandler: [app.requireAuth, requireOrgCapability("org:members")] }, async (req, reply) => {
    const { inviteId } = req.params as { inviteId: string };
    const invite = await prisma.orgInvite.findFirst({ where: { id: inviteId, orgId: req.orgCtx!.orgId } });
    if (!invite) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Invite not found." } });
    if (!canGrantRoles(req.orgCtx!.roles, invite.roles)) return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only an owner can revoke this invite." } });
    await prisma.orgInvite.delete({ where: { id: inviteId } });
    await recordAudit(req, { action: "revoke", entity: "org-invite", entityId: inviteId, summary: `Revoked invitation in ${req.orgCtx!.orgId}` });
    return { success: true, data: { revoked: true } };
  });

  app.post("/:orgId/invites/:inviteId/resend", { preHandler: [app.requireAuth, requireOrgCapability("org:members")], config: { rateLimit: { max: 5, timeWindow: "1 minute" } } }, async (req, reply) => {
    const { inviteId } = req.params as { inviteId: string };
    const invite = await prisma.orgInvite.findFirst({ where: { id: inviteId, orgId: req.orgCtx!.orgId, acceptedAt: null, expiresAt: { gt: new Date() } } });
    if (!invite) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Invitation not found." } });
    if (!canGrantRoles(req.orgCtx!.roles, invite.roles)) return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only an owner can resend this invitation." } });
    const delivery = await deliverInvitation(invite.id);
    await recordAudit(req, { action: "update", entity: "org-invite", entityId: invite.id, summary: `Invitation email: ${delivery.status}` });
    return { success: true, data: { token: invite.token, delivery } };
  });

  // Accept an invite — token is the credential; email must match the caller.
  app.post("/invites/accept", { preHandler: app.requireAuth }, async (req, reply) => {
    const { token } = z.object({ token: z.string().min(10) }).parse(req.body);
    const invite = await prisma.orgInvite.findUnique({ where: { token } });
    if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
      return reply.code(400).send({ success: false, error: { code: "INVITE_INVALID", message: "This invite is invalid or expired." } });
    }
    if (invite.email !== req.session!.email.toLowerCase()) {
      return reply.code(403).send({ success: false, error: { code: "INVITE_EMAIL_MISMATCH", message: "This invite was sent to a different email." } });
    }
    const member = await prisma.$transaction(async (tx) => {
      await lockOrganization(tx, invite.orgId);
      const current = await tx.orgInvite.findUnique({ where: { id: invite.id } });
      if (!current || current.acceptedAt || current.expiresAt <= new Date()) throw accountError(409, "INVITE_INVALID", "This invitation is no longer available.");
      const inviter = await tx.orgMember.findFirst({ where: { id: current.invitedById, orgId: invite.orgId, status: "ACTIVE" } });
      if (!inviter || !canGrantRoles(inviter.roles, current.roles)) throw accountError(403, "INVITE_INVALID", "Ask an administrator for a new invitation.");
      const existing = await tx.orgMember.findUnique({ where: { orgId_userId: { orgId: invite.orgId, userId: req.session!.id } } });
      if (existing?.status === "ACTIVE") throw accountError(409, "ALREADY_MEMBER", "You already belong to this organization. Ask an administrator to change your role.");
      // Invitations cannot bypass a deliberate suspension or offboarding.
      if (existing) throw accountError(403, "ACCESS_REVOKED", "Ask your organization administrator to restore your access.");
      await assertSeatAvailable(tx, invite.orgId);
      const m = await tx.orgMember.create({ data: { orgId: invite.orgId, userId: req.session!.id, roles: current.roles } });
      await tx.orgInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
      return m;
    });
    await recordAudit(req, { action: "accept", entity: "org-invite", entityId: invite.id, summary: `Joined organization ${invite.orgId}` });
    return { success: true, data: { orgId: invite.orgId, memberId: member.id, roles: member.roles } };
  });

  // ── Departments & teams ──────────────────────────────────────────
  app.get("/:orgId/departments", { preHandler: [app.requireAuth, requireOrgCapability("org:members")] }, async (req) => {
    const departments = await prisma.department.findMany({
      where: { orgId: req.orgCtx!.orgId },
      select: { id: true, name: true, parentId: true, _count: { select: { members: true, teams: true } } },
      orderBy: { name: "asc" },
    });
    return { success: true, data: departments };
  });

  app.post("/:orgId/departments", { preHandler: [app.requireAuth, requireOrgCapability("org:manage")] }, async (req, reply) => {
    const body = z.object({ name: z.string().trim().min(1).max(60), parentId: z.string().nullable().optional() }).parse(req.body);
    if (body.parentId) {
      const parent = await prisma.department.findFirst({ where: { id: body.parentId, orgId: req.orgCtx!.orgId }, select: { id: true } });
      if (!parent) return reply.code(400).send({ success: false, error: { code: "VALIDATION", message: "Parent department not in this org." } });
    }
    const dept = await prisma.department.create({ data: { orgId: req.orgCtx!.orgId, name: body.name, parentId: body.parentId ?? null } });
    await recordAudit(req, { action: "create", entity: "org-department", entityId: dept.id, summary: `Created department "${dept.name}"` });
    return reply.code(201).send({ success: true, data: dept });
  });

  app.delete("/:orgId/departments/:id", { preHandler: [app.requireAuth, requireOrgCapability("org:manage")] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const dept = await prisma.department.findFirst({ where: { id, orgId: req.orgCtx!.orgId }, select: { _count: { select: { members: true } } } });
    if (!dept) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Department not found." } });
    if (dept._count.members > 0) {
      return reply.code(409).send({ success: false, error: { code: "HAS_DEPENDENTS", message: "Move members out before deleting." } });
    }
    await prisma.department.delete({ where: { id } });
    return { success: true, data: { id } };
  });

  app.get("/:orgId/teams", { preHandler: [app.requireAuth, requireOrgCapability("org:members")] }, async (req) => {
    // ENG_MANAGER reach is department-scoped (ABAC step two).
    const where: Prisma.TeamWhereInput = { orgId: req.orgCtx!.orgId };
    if (req.orgCtx!.scope === "department") where.departmentId = req.orgCtx!.departmentId ?? "__none__";
    const teams = await prisma.team.findMany({
      where,
      select: { id: true, name: true, departmentId: true, _count: { select: { members: true } } },
      orderBy: { name: "asc" },
    });
    return { success: true, data: teams };
  });

  app.post("/:orgId/teams", { preHandler: [app.requireAuth, requireOrgCapability("org:manage")] }, async (req, reply) => {
    const body = z.object({ name: z.string().trim().min(1).max(60), departmentId: z.string().nullable().optional() }).parse(req.body);
    if (body.departmentId) {
      const dept = await prisma.department.findFirst({ where: { id: body.departmentId, orgId: req.orgCtx!.orgId }, select: { id: true } });
      if (!dept) return reply.code(400).send({ success: false, error: { code: "VALIDATION", message: "Department not in this org." } });
    }
    const team = await prisma.team.create({ data: { orgId: req.orgCtx!.orgId, name: body.name, departmentId: body.departmentId ?? null } });
    return reply.code(201).send({ success: true, data: team });
  });

  app.post("/:orgId/teams/:teamId/members", { preHandler: [app.requireAuth, requireOrgCapability("org:members")] }, async (req, reply) => {
    const { teamId } = req.params as { teamId: string };
    const { memberId } = z.object({ memberId: z.string() }).parse(req.body);
    const [team, member] = await Promise.all([
      prisma.team.findFirst({ where: { id: teamId, orgId: req.orgCtx!.orgId }, select: { id: true } }),
      prisma.orgMember.findFirst({ where: { id: memberId, orgId: req.orgCtx!.orgId }, select: { id: true } }),
    ]);
    if (!team || !member) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Team or member not found." } });
    await prisma.teamMember.upsert({
      where: { teamId_memberId: { teamId, memberId } },
      update: {},
      create: { teamId, memberId },
    });
    return reply.code(201).send({ success: true, data: { teamId, memberId } });
  });
}
