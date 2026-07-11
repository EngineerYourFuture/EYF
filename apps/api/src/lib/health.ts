/**
 * Liveness vs. readiness (Kubernetes / LB semantics).
 *   /livez  — process is up. Cheap, never touches dependencies. Restart if it fails.
 *   /readyz — dependencies reachable (Postgres + Redis). Pull from the LB rotation
 *             if it fails, but DON'T restart — the instance is fine, its deps aren't.
 * A shallow {ok:true} health check routes traffic to a pod that can't reach the DB;
 * these don't.
 */
import { prisma } from "@eyf/db";
import { redis } from "./redis.js";

export async function checkReadiness(): Promise<{
  ok: boolean;
  checks: { db: boolean; redis: boolean };
}> {
  const [db, r] = await Promise.all([
    prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
    redis.ping().then((v) => v === "PONG").catch(() => false),
  ]);
  return { ok: db && r, checks: { db, redis: r } };
}
