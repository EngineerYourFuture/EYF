import type { FastifyInstance, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import type { Plan, SessionUser } from "@eyf/types";
import { meetsPlan } from "@eyf/types";
import { prisma } from "@eyf/db";
import { verifyClerkSession, hasRealClerk } from "../services/clerk.js";
import { env } from "../env.js";

function planFromTier(tier: string): Plan {
  return tier.toLowerCase() as Plan;
}

async function resolveSession(
  app: FastifyInstance,
  req: FastifyRequest,
): Promise<SessionUser | null> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7);

  if (hasRealClerk()) {
    try {
      const claims = await verifyClerkSession(token);
      const user = await prisma.user.findUnique({
        where: { clerkId: claims.sub },
        include: { subscription: true },
      });
      if (user) {
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          plan: planFromTier(user.subscription?.plan ?? "FREE"),
        };
      }
    } catch {
      /* fall through to internal JWT */
    }
  }

  try {
    const session = app.jwt.verify<SessionUser & { sid?: string }>(token) as SessionUser & { sid?: string };
    // Account-sharing control: a token carrying a `sid` is only valid while that
    // session row exists. Evicting the row (via the concurrent-session cap on a
    // new login) invalidates the token → that device is forced to re-auth.
    if (session.sid) {
      const active = await prisma.userSession.findUnique({
        where: { id: session.sid }, select: { id: true, lastSeenAt: true },
      });
      if (!active) return null;
      // Throttle the lastSeenAt write to at most once every 5 minutes.
      if (Date.now() - active.lastSeenAt.getTime() > 5 * 60 * 1000) {
        void prisma.userSession.update({ where: { id: session.sid }, data: { lastSeenAt: new Date() } }).catch(() => {});
      }
    }
    return session;
  } catch {
    return null;
  }
}

async function authPluginInner(app: FastifyInstance) {
  app.decorate("requireAuth", async (req, reply) => {
    const session = await resolveSession(app, req);
    if (!session) {
      return reply.code(401).send({
        success: false,
        error: { code: "UNAUTHENTICATED", message: "Sign in to continue." },
      });
    }
    req.session = session;
  });

  app.decorate("requirePlan", (plans: Plan[]) => async (req, reply) => {
    if (!req.session) {
      const session = await resolveSession(app, req);
      if (!session) {
        return reply.code(401).send({
          success: false,
          error: { code: "UNAUTHENTICATED", message: "Sign in to continue." },
        });
      }
      req.session = session;
    }
    // Paywall disabled pre-launch: authenticated users get full access.
    if (!env.BILLING_ENABLED) return;
    const check = meetsPlan(req.session.plan, plans);
    if (!check.ok) {
      return reply.code(402).send({
        success: false,
        error: {
          code: "PLAN_UPGRADE_REQUIRED",
          message: `This feature requires the ${check.minRequired} plan or higher.`,
          upgradeRequired: true,
          plan: check.minRequired,
        },
      });
    }
  });

  app.decorate("requireRole", (roles: SessionUser["role"][]) => async (req, reply) => {
    if (!req.session) {
      const session = await resolveSession(app, req);
      if (!session) {
        return reply.code(401).send({
          success: false,
          error: { code: "UNAUTHENTICATED", message: "Sign in to continue." },
        });
      }
      req.session = session;
    }
    if (!roles.includes(req.session.role)) {
      return reply.code(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "Insufficient permissions." },
      });
    }
  });
}

export const authPlugin = fp(authPluginInner, { name: "eyf-auth" });
