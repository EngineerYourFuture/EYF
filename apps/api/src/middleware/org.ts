/**
 * Org membership gate (enterprise platform, PRD §9/§25).
 *
 * Use AFTER app.requireAuth. Resolves the caller's membership in the org named
 * by the :orgId route param, evaluates the capability through the shared
 * choke point (@eyf/types canInOrg), and attaches the decision so handlers can
 * apply the ABAC scope as a query filter. Org context ALWAYS comes from the
 * path — never inferred from the token (PRD §14).
 */
import type { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "@eyf/db";
import { resolveOrgAccess, type OrgCapability, type OrgScope, type GrantSource } from "@eyf/types";

export type OrgContext = {
  orgId: string;
  memberId: string;
  roles: string[];
  departmentId: string | null;
  scope: OrgScope;
  /** Which permission source granted access, and why — for audit logging. */
  grantSource?: GrantSource;
  grantReason?: string;
};

declare module "fastify" {
  interface FastifyRequest {
    orgCtx?: OrgContext;
  }
}

export function requireOrgCapability(capability: OrgCapability) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.session) {
      return reply.code(401).send({ success: false, error: { code: "UNAUTHENTICATED", message: "Sign in to continue." } });
    }
    const { orgId } = req.params as { orgId?: string };
    if (!orgId) {
      return reply.code(400).send({ success: false, error: { code: "ORG_REQUIRED", message: "Org context missing." } });
    }
    const member = await prisma.orgMember.findUnique({
      where: { orgId_userId: { orgId, userId: req.session.id } },
      select: { id: true, roles: true, departmentId: true, status: true },
    });
    // Non-members get 404, not 403 — don't confirm an org exists (PRD §25).
    if (!member || member.status !== "ACTIVE") {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Not found." } });
    }
    // Resolve through the deterministic engine. Role-only input here is
    // equivalent to the legacy canInOrg (proven in authz.test.ts); the engine
    // additionally surfaces the grant source + reason for audit and is ready to
    // accept direct/group/temporary/platform entries when those sources land.
    const decision = resolveOrgAccess(capability, { roles: member.roles });
    if (!decision.granted) {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "You don't have permission for this." } });
    }
    req.orgCtx = {
      orgId,
      memberId: member.id,
      roles: member.roles,
      departmentId: member.departmentId,
      scope: decision.scope,
      grantSource: decision.source,
      grantReason: decision.reason,
    };
  };
}

/** Membership-only gate (any active member, e.g. /work surfaces). */
export async function requireOrgMember(req: FastifyRequest, reply: FastifyReply) {
  if (!req.session) {
    return reply.code(401).send({ success: false, error: { code: "UNAUTHENTICATED", message: "Sign in to continue." } });
  }
  const { orgId } = req.params as { orgId?: string };
  if (!orgId) {
    return reply.code(400).send({ success: false, error: { code: "ORG_REQUIRED", message: "Org context missing." } });
  }
  const member = await prisma.orgMember.findUnique({
    where: { orgId_userId: { orgId, userId: req.session.id } },
    select: { id: true, roles: true, departmentId: true, status: true },
  });
  if (!member || member.status !== "ACTIVE") {
    return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Not found." } });
  }
  req.orgCtx = { orgId, memberId: member.id, roles: member.roles, departmentId: member.departmentId, scope: "own" };
}
