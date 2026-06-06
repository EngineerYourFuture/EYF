// MUST be a .d.ts with top-level imports for `declare module` of external
// packages to augment globally. The @fastify/jwt FastifyJWT lives inside
// its `fastifyJwt` namespace — augmentation must mirror that nesting.
import "@fastify/jwt";
import "fastify";
import type { FastifyReply, FastifyRequest } from "fastify";

type EyfPlan = "free" | "basic" | "pro" | "elite";
type EyfRole =
  | "GUEST"
  | "STUDENT_FREE"
  | "STUDENT_BASIC"
  | "STUDENT_PRO"
  | "STUDENT_ELITE"
  | "MENTOR"
  | "CONTENT_CREATOR"
  | "ADMIN";

interface EyfSessionUser {
  id: string;
  email: string;
  name: string;
  role: EyfRole;
  plan: EyfPlan;
}

type PreHandler = (req: FastifyRequest, reply: FastifyReply) => Promise<void> | void;

declare module "fastify" {
  interface FastifyInstance {
    requireAuth: PreHandler;
    requirePlan: (plans: EyfPlan[]) => PreHandler;
    requireRole: (roles: EyfRole[]) => PreHandler;
  }
  interface FastifyRequest {
    // EYF-specific session, populated by requireAuth. Use this instead of
    // `req.user` (which @fastify/jwt types as the raw signed payload).
    session?: EyfSessionUser;
  }
}
