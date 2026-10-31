import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "@eyf/db";
import { buildApp } from "../app.js";
import { env } from "../env.js";
import { redis } from "../lib/redis.js";
import { judgeQueue, judgeQueueEvents } from "../jobs/queue.js";

if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(env.DATABASE_URL).hostname)) throw new Error("This synthetic load check requires a local database.");
const stamp = `load-${randomUUID()}`;
const app = await buildApp();
const users: string[] = [], durations: number[] = [];
let orgId: string | undefined;
try {
  const tokens = [];
  for (let i = 0; i < 20; i++) {
    const user = await prisma.user.create({ data: { clerkId: `${stamp}-${i}`, email: `${stamp}-${i}@test.eyf`, name: "Synthetic load learner" } }); users.push(user.id);
    tokens.push(app.jwt.sign({ id: user.id, email: user.email }));
  }
  const org = await prisma.organization.create({ data: { name: stamp, slug: stamp, accessCode: stamp, members: { create: users.map((userId) => ({ userId, roles: ["MEMBER"] })) }, courses: { create: { title: "Synthetic load course", published: true, status: "PUBLISHED", lessons: { create: { title: "A lesson", content: "", blocks: [{ type: "rich_text", data: { text: "Synthetic load content" } }] } } } } }, include: { courses: true } }); orgId = org.id;
  const address = await app.listen({ host: "127.0.0.1", port: 0 });
  await Promise.all(tokens.map(async (token) => {
    for (let i = 0; i < 10; i++) {
      const path = i % 2 ? `/v1/orgs/${org.id}/work/courses/${org.courses[0]!.id}` : `/v1/orgs/${org.id}/work/courses`;
      const start = performance.now();
      const response = await fetch(`${address}${path}`, { headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10_000) });
      const body = await response.json() as { success: boolean };
      assert.equal(response.status, 200); assert.equal(body.success, true); durations.push(performance.now() - start);
    }
  }));
  durations.sort((a, b) => a - b);
  const p95 = Math.round(durations[Math.ceil(durations.length * 0.95) - 1]!);
  console.log(`PASS: ${durations.length} authenticated LMS reads, 20 concurrent learners, zero failed requests; p95=${p95}ms.`);
  assert.ok(p95 < 2000, "Local p95 exceeded the 2-second pilot budget");
  console.log("Scope: local API/database concurrency only; repeat against staging for network, media streaming and real-provider capacity.");
} catch { console.error("FAIL: local LMS load check failed its response or latency assertions."); process.exitCode = 1; }
finally {
  await app.close();
  if (orgId) await prisma.organization.delete({ where: { id: orgId } });
  await prisma.user.deleteMany({ where: { id: { in: users } } });
  await judgeQueue.close(); await judgeQueueEvents.close(); await redis.quit(); await prisma.$disconnect();
}
