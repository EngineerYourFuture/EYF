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
import { requireOrgCapability } from "../middleware/org.js";
import { recordAudit } from "../lib/audit.js";
import { withOrgContext } from "../lib/org-scoped.js";
import { bumpUsage, getUsage } from "../lib/usage.js";

const ORG_ROLES = Object.values(OrgRole);
const rolesInput = z.array(z.nativeEnum(OrgRole)).min(1).max(5);

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "org";

export async function orgsRoutes(app: FastifyInstance) {
  // ── Org lifecycle ────────────────────────────────────────────────
  // Create an org — the creator becomes OWNER. Trial plan by default.
  app.post("/", { preHandler: app.requireAuth }, async (req, reply) => {
    const body = z.object({ name: z.string().trim().min(2).max(80) }).parse(req.body);
    const base = slugify(body.name);
    // Suffix on collision — slugs are public and permanent.
    let slug = base;
    for (let i = 2; await prisma.organization.findUnique({ where: { slug }, select: { id: true } }); i++) {
      slug = `${base}-${i}`;
    }
    const org = await prisma.organization.create({
      data: {
        name: body.name,
        slug,
        accessCode: randomBytes(12).toString("hex"), // legacy portal field; unused by membership flow
        members: { create: { userId: req.session!.id, roles: [OrgRole.OWNER] } },
      },
      select: { id: true, name: true, slug: true, plan: true, seatsLicensed: true },
    });
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
    const nextCursor = members.length > q.limit ? members.pop()!.id : null;
    return { success: true, data: { items: members, nextCursor } };
  });

  // Change a member's roles/department — role-grant hierarchy enforced (§9).
  app.patch("/:orgId/members/:memberId", { preHandler: [app.requireAuth, requireOrgCapability("org:members")] }, async (req, reply) => {
    const { memberId } = req.params as { memberId: string };
    const body = z.object({
      roles: rolesInput.optional(),
      departmentId: z.string().nullable().optional(),
      title: z.string().max(80).nullable().optional(),
      status: z.enum(["ACTIVE", "SUSPENDED", "OFFBOARDED"]).optional(),
    }).parse(req.body);

    const target = await prisma.orgMember.findFirst({
      where: { id: memberId, orgId: req.orgCtx!.orgId },
      select: { id: true, roles: true, userId: true },
    });
    if (!target) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Member not found." } });

    if (body.roles) {
      // Hierarchy covers both the roles being granted AND the roles being
      // touched (an HR must not edit an ADMIN's role set).
      if (!canGrantRoles(req.orgCtx!.roles, [...body.roles, ...target.roles])) {
        return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Only the owner can change ADMIN/OWNER roles." } });
      }
      // Never let the last OWNER demote themselves out of the org.
      if (target.roles.includes(OrgRole.OWNER) && !body.roles.includes(OrgRole.OWNER)) {
        const owners = await prisma.orgMember.count({ where: { orgId: req.orgCtx!.orgId, roles: { has: OrgRole.OWNER }, status: "ACTIVE" } });
        if (owners <= 1) {
          return reply.code(400).send({ success: false, error: { code: "LAST_OWNER", message: "An org must keep at least one owner." } });
        }
      }
    }
    if (body.departmentId) {
      const dept = await prisma.department.findFirst({ where: { id: body.departmentId, orgId: req.orgCtx!.orgId }, select: { id: true } });
      if (!dept) return reply.code(400).send({ success: false, error: { code: "VALIDATION", message: "Department not in this org." } });
    }

    const updated = await prisma.orgMember.update({ where: { id: target.id }, data: body });
    await recordAudit(req, { action: "update", entity: "org-member", entityId: target.id, summary: `Org ${req.orgCtx!.orgId}: member roles/status changed` });
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
    return reply.code(201).send({ success: true, data: invite });
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
      const m = await tx.orgMember.upsert({
        where: { orgId_userId: { orgId: invite.orgId, userId: req.session!.id } },
        update: { roles: invite.roles, status: "ACTIVE" },
        create: { orgId: invite.orgId, userId: req.session!.id, roles: invite.roles },
      });
      await tx.orgInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
      return m;
    });
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
