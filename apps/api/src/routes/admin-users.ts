/**
 * Admin user management — capability-gated (manage:users). List users, change
 * their role, change their plan (via Subscription), and suspend/restore (soft
 * delete via User.deletedAt). Self-lockout guards prevent an admin from
 * demoting or suspending their own account.
 */
import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma, Role, PlanTier } from "@eyf/db";
import { requirePermission } from "../middleware/permissions.js";
import { recordAudit } from "../lib/audit.js";

const badRequest = (reply: FastifyReply, msg: string) =>
  reply.code(400).send({ success: false, error: { code: "VALIDATION", message: msg } });
const notFound = (reply: FastifyReply) =>
  reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "User not found." } });

export async function adminUsersRoutes(app: FastifyInstance) {
  const guard = { preHandler: [app.requireAuth, requirePermission("manage:users")] };

  // List (recent 100, optional case-insensitive search by name/email).
  app.get("/", guard, async (req) => {
    const { q } = req.query as { q?: string };
    const where = q?.trim()
      ? { OR: [
          { email: { contains: q.trim(), mode: "insensitive" as const } },
          { name: { contains: q.trim(), mode: "insensitive" as const } },
        ] }
      : {};
    const users = await prisma.user.findMany({
      where, orderBy: { createdAt: "desc" }, take: 100,
      select: {
        id: true, name: true, email: true, role: true, college: true,
        createdAt: true, deletedAt: true,
        subscription: { select: { plan: true, status: true } },
      },
    });
    return {
      success: true,
      data: users.map((u) => ({
        id: u.id, name: u.name, email: u.email, role: u.role, college: u.college,
        createdAt: u.createdAt, suspended: u.deletedAt != null,
        plan: u.subscription?.plan ?? "FREE", subscriptionStatus: u.subscription?.status ?? null,
      })),
    };
  });

  const roleBody = z.object({ role: z.nativeEnum(Role) });
  app.patch("/:id/role", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = roleBody.safeParse(req.body);
    if (!parsed.success) return badRequest(reply, "Invalid role");
    if (id === req.session!.id) return badRequest(reply, "You can't change your own role.");
    const u = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!u) return notFound(reply);
    await prisma.user.update({ where: { id }, data: { role: parsed.data.role } });
    await recordAudit(req, { action: "role", entity: "user", entityId: id, summary: `Set role → ${parsed.data.role}` });
    return { success: true, data: { id, role: parsed.data.role } };
  });

  const planBody = z.object({ plan: z.nativeEnum(PlanTier) });
  app.patch("/:id/plan", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = planBody.safeParse(req.body);
    if (!parsed.success) return badRequest(reply, "Invalid plan");
    const u = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!u) return notFound(reply);
    await prisma.subscription.upsert({
      where: { userId: id },
      create: { userId: id, plan: parsed.data.plan },
      update: { plan: parsed.data.plan },
    });
    await recordAudit(req, { action: "plan", entity: "user", entityId: id, summary: `Set plan → ${parsed.data.plan}` });
    return { success: true, data: { id, plan: parsed.data.plan } };
  });

  const statusBody = z.object({ suspended: z.boolean() });
  app.patch("/:id/status", guard, async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = statusBody.safeParse(req.body);
    if (!parsed.success) return badRequest(reply, "Invalid status");
    if (id === req.session!.id) return badRequest(reply, "You can't suspend your own account.");
    const u = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!u) return notFound(reply);
    await prisma.user.update({ where: { id }, data: { deletedAt: parsed.data.suspended ? new Date() : null } });
    await recordAudit(req, { action: "status", entity: "user", entityId: id, summary: parsed.data.suspended ? "Suspended account" : "Restored account" });
    return { success: true, data: { id, suspended: parsed.data.suspended } };
  });
}
