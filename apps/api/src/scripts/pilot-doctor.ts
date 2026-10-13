import "dotenv/config";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { prisma } from "@eyf/db";
import { env } from "../env.js";
import { redis } from "../lib/redis.js";
import { judgeQueue, judgeQueueEvents } from "../jobs/queue.js";
import { checkReadiness } from "../lib/health.js";
import { judgeAvailable } from "../services/judge-availability.js";
import { credentialStatus } from "../lib/configuration-status.js";
import { access, constants } from "node:fs/promises";
import { resolve } from "node:path";

try {
  const health = await checkReadiness();
  for (const [name, ok] of Object.entries(health.checks)) console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
  const judge = await judgeAvailable(); console.log(`${judge ? "PASS" : "BLOCKED"}: judge API + EYF worker${judge ? " (run judge:smoke for execution evidence)" : ""}`);
  // Resolve only standard installation paths, never an executable from the shell PATH.
  const dockerPath = ["/Applications/Docker.app/Contents/Resources/bin/docker", "/usr/bin/docker", "/usr/local/bin/docker", "/opt/homebrew/bin/docker"].find(existsSync);
  if (dockerPath) {
  const docker = spawnSync(dockerPath, ["info", "--format", "{{.CgroupVersion}} {{.Architecture}}"], { encoding: "utf8", timeout: 5000 });
  if (docker.status === 0) { const [cgroup, architecture] = docker.stdout.trim().split(" "); console.log(`INFO: Docker cgroup=${cgroup}, architecture=${architecture}`); if ((cgroup !== "1" || architecture !== "x86_64") && ["localhost", "127.0.0.1", "[::1]"].includes(new URL(env.JUDGE0_URL).hostname)) console.log("BLOCKED: bundled Judge0 requires a compatible Linux amd64/cgroup-v1 host. Configure JUDGE0_URL for that host; keep sandbox isolation enabled."); }
  else console.log("INFO: Docker is stopped or unavailable; run judge:start for setup diagnostics.");
  } else console.log("INFO: Docker CLI not found in standard installation paths; host details unavailable.");
  for (const [name, value] of [["Clerk authentication", env.CLERK_SECRET_KEY], ["AI interviews", env.ANTHROPIC_API_KEY], ["Audio transcription", env.OPENAI_API_KEY], ["Transactional email", env.RESEND_API_KEY], ["Error monitoring", env.SENTRY_DSN]]) console.log(`${credentialStatus(value).toUpperCase()}: ${name}; live-provider verification still required.`);
  let storageReady = true;
  try { await access(existsSync(env.PRIVATE_MEDIA_DIR) ? env.PRIVATE_MEDIA_DIR : resolve(env.PRIVATE_MEDIA_DIR, ".."), constants.W_OK); }
  catch { storageReady = false; }
  console.log(`${storageReady ? "PASS" : "FAIL"}: private media volume writable${storageReady ? " (include it in backups)" : ""}`);
  console.log(`INFO: payments ${env.BILLING_ENABLED ? "enabled" : "deferred (preview access)"}.`);
  const migrations = await prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*) AS count FROM "_prisma_migrations" WHERE "finished_at" IS NULL AND "rolled_back_at" IS NULL`;
  console.log(`${migrations[0]?.count === 0n ? "PASS" : "FAIL"}: no incomplete database migrations`);
  const configured = [env.CLERK_SECRET_KEY, env.ANTHROPIC_API_KEY, env.OPENAI_API_KEY, env.RESEND_API_KEY, env.SENTRY_DSN].every((value) => credentialStatus(value) === "configured");
  if (process.argv.includes("--strict") && !configured) { console.log("FAIL: production integrations are incomplete; configured keys still require live acceptance checks."); process.exitCode = 1; }
  if (!health.ok || !judge || !storageReady || migrations[0]?.count !== 0n) process.exitCode = 1;
} catch { console.error("FAIL: could not complete local readiness checks. Verify service configuration without sharing secrets."); process.exitCode = 1; }
finally { await judgeQueue.close(); await judgeQueueEvents.close(); await redis.quit(); await prisma.$disconnect(); }
