/**
 * Skill Ledger surfaces (PRD §15.13 / §15.3 / §15.13 matrix). Role bars to
 * measure against, the org skill matrix (department × skill), and a member's
 * ledger with gap-to-bar. All reads are ABAC-scoped via req.orgCtx.scope.
 */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@eyf/db";
import { barFit, type SkillLevel } from "@eyf/types";
import { requireOrgCapability } from "../middleware/org.js";
import { findOrCreateSkill, memberLedger } from "../lib/skill-ledger.js";
import { recordAudit } from "../lib/audit.js";

export async function orgSkillsRoutes(app: FastifyInstance) {
  const skillsRead = { preHandler: [app.requireAuth, requireOrgCapability("people:skills-read")] };
  const author = { preHandler: [app.requireAuth, requireOrgCapability("learn:author")] };

  // ── Role bars (learn:author edits, skills-read views) ──────────────
  app.get("/:orgId/role-bars", skillsRead, async (req) => {
    const bars = await prisma.roleBar.findMany({
      where: { orgId: req.orgCtx!.orgId },
      include: { skills: true },
      orderBy: { createdAt: "desc" },
    });
    const skillIds = [...new Set(bars.flatMap((b) => b.skills.map((s) => s.skillId)))];
    const skills = await prisma.skill.findMany({ where: { id: { in: skillIds } }, select: { id: true, slug: true, name: true } });
    const byId = new Map(skills.map((s) => [s.id, s]));
    return {
      success: true,
      data: bars.map((b) => ({
        id: b.id, name: b.name, basedOnTier: b.basedOnTier,
        skills: b.skills.map((s) => ({ skillId: s.skillId, slug: byId.get(s.skillId)?.slug, name: byId.get(s.skillId)?.name, requiredLevel: s.requiredLevel, weight: s.weight })),
      })),
    };
  });

  app.post("/:orgId/role-bars", author, async (req, reply) => {
    const body = z.object({
      name: z.string().trim().min(2).max(80),
      basedOnTier: z.string().max(40).nullable().optional(),
      skills: z.array(z.object({
        skillSlug: z.string().min(1).max(60),
        requiredLevel: z.number().int().min(0).max(100),
        weight: z.number().min(0).max(10).default(1),
      })).max(30).default([]),
    }).parse(req.body);

    const resolved = await Promise.all(body.skills.map(async (s) => ({ skillId: await findOrCreateSkill(s.skillSlug), requiredLevel: s.requiredLevel, weight: s.weight })));
    const bar = await prisma.roleBar.create({
      data: {
        orgId: req.orgCtx!.orgId, name: body.name, basedOnTier: body.basedOnTier ?? null,
        skills: { create: resolved },
      },
      include: { skills: true },
    });
    await recordAudit(req, { action: "create", entity: "org-role-bar", entityId: bar.id, summary: `Role bar "${bar.name}" (${bar.skills.length} skills)` });
    return reply.code(201).send({ success: true, data: bar });
  });

  // ── Member ledger + gap to a role bar ──────────────────────────────
  app.get("/:orgId/members/:memberId/ledger", skillsRead, async (req, reply) => {
    const { memberId } = req.params as { memberId: string };
    const q = z.object({ roleBarId: z.string().optional() }).parse(req.query);

    const member = await prisma.orgMember.findFirst({
      where: { id: memberId, orgId: req.orgCtx!.orgId },
      select: { id: true, userId: true, departmentId: true, user: { select: { name: true } } },
    });
    if (!member) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Member not found." } });
    // ABAC step two — enforce the scope the choke point returned.
    if (req.orgCtx!.scope === "own" && member.id !== req.orgCtx!.memberId) {
      return reply.code(403).send({ success: false, error: { code: "OUT_OF_SCOPE", message: "You can only read your own ledger." } });
    }
    if (req.orgCtx!.scope === "department" && member.departmentId !== req.orgCtx!.departmentId) {
      return reply.code(403).send({ success: false, error: { code: "OUT_OF_SCOPE", message: "That member is outside your department." } });
    }

    const ledger = await memberLedger(member.userId, req.orgCtx!.orgId);
    let gap = null;
    if (q.roleBarId) {
      const bar = await prisma.roleBar.findFirst({ where: { id: q.roleBarId, orgId: req.orgCtx!.orgId }, include: { skills: true } });
      if (bar) {
        const levels: SkillLevel[] = ledger.map((l) => ({ skillId: l.skillId, level: l.level }));
        const fit = barFit(levels, bar.skills.map((s) => ({ skillId: s.skillId, requiredLevel: s.requiredLevel, weight: s.weight })));
        const names = new Map((await prisma.skill.findMany({ where: { id: { in: bar.skills.map((s) => s.skillId) } }, select: { id: true, name: true } })).map((s) => [s.id, s.name]));
        gap = { roleBar: bar.name, overall: fit.overall, gaps: fit.gaps.map((g) => ({ ...g, name: names.get(g.skillId) ?? g.skillId })) };
      }
    }
    return { success: true, data: { member: { id: member.id, name: member.user.name }, ledger, gap } };
  });

  // ── Org skill matrix (department × skill heat grid) ────────────────
  app.get("/:orgId/skills/matrix", skillsRead, async (req, reply) => {
    // The matrix is an aggregate over other people — "own" reach (MEMBER/
    // INTERN) can never see it. Their self-ledger endpoint serves them.
    if (req.orgCtx!.scope === "own") {
      return reply.code(403).send({ success: false, error: { code: "OUT_OF_SCOPE", message: "The skill matrix is a team view — use your own ledger." } });
    }
    // Scope rows to reach; org for HR/LND/ADMIN, department for EM.
    const memberWhere: { orgId: string; status: "ACTIVE"; departmentId?: string } = { orgId: req.orgCtx!.orgId, status: "ACTIVE" };
    if (req.orgCtx!.scope === "department") memberWhere.departmentId = req.orgCtx!.departmentId ?? "__none__";

    const [members, departments] = await Promise.all([
      prisma.orgMember.findMany({ where: memberWhere, select: { userId: true, departmentId: true } }),
      prisma.department.findMany({ where: { orgId: req.orgCtx!.orgId }, select: { id: true, name: true } }),
    ]);
    const userIds = members.map((m) => m.userId);
    const deptOfUser = new Map(members.map((m) => [m.userId, m.departmentId ?? "__none__"]));

    const snaps = userIds.length
      ? await prisma.skillSnapshot.findMany({ where: { orgId: req.orgCtx!.orgId, userId: { in: userIds } }, select: { userId: true, skillId: true, level: true } })
      : [];
    const skillIds = [...new Set(snaps.map((s) => s.skillId))];
    const skills = await prisma.skill.findMany({ where: { id: { in: skillIds } }, select: { id: true, slug: true, name: true } });

    // Aggregate: average level per (department, skill).
    type Cell = { sum: number; count: number };
    const grid = new Map<string, Cell>(); // key = deptId::skillId
    for (const s of snaps) {
      const dept = deptOfUser.get(s.userId) ?? "__none__";
      const key = `${dept}::${s.skillId}`;
      const cell = grid.get(key) ?? { sum: 0, count: 0 };
      cell.sum += s.level; cell.count += 1;
      grid.set(key, cell);
    }
    const deptList = [...departments, { id: "__none__", name: "Unassigned" }].filter((d) => members.some((m) => (m.departmentId ?? "__none__") === d.id));
    const matrix = deptList.map((d) => ({
      department: d.name,
      departmentId: d.id,
      cells: skills.map((sk) => {
        const cell = grid.get(`${d.id}::${sk.id}`);
        return { skillId: sk.id, slug: sk.slug, level: cell ? Math.round(cell.sum / cell.count) : null, coverage: cell?.count ?? 0 };
      }),
    }));
    return { success: true, data: { skills: skills.map((s) => ({ id: s.id, slug: s.slug, name: s.name })), matrix, memberCount: members.length } };
  });
}
