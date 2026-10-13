import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";

// Only disposable containers on an internal network; never reads local .env files.
const docker = process.env.DOCKER_BIN ?? "docker";
const image = process.argv[2] ?? "eyf-api:local-readiness";
const prefix = `eyf-smoke-${randomUUID()}`;
const containers = [];
const runtimeEnv = {
  NODE_ENV: "production",
  DATABASE_URL: "postgresql://smoke:smoke@postgres:5432/smoke",
  REDIS_URL: "redis://redis:6379",
  JWT_ACCESS_SECRET: randomUUID(),
  JWT_REFRESH_SECRET: randomUUID(),
  NEXT_PUBLIC_APP_URL: "https://eyf.invalid",
  NEXT_PUBLIC_LMS_URL: "https://lms.eyf.invalid",
  API_CORS_ORIGINS: "https://eyf.invalid,https://lms.eyf.invalid",
  PRIVATE_MEDIA_DIR: "/app/private-media",
  BILLING_ENABLED: "false",
};

function run(...args) {
  return execFileSync(docker, args, { encoding: "utf8", timeout: 60_000, stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function start(name, args) {
  const id = `${prefix}-${name}`;
  containers.push(id);
  run("run", "-d", "--name", id, "--network", prefix, "--network-alias", name, ...args);
  return id;
}

async function until(check, label) {
  let failure;
  for (let attempt = 0; attempt < 30; attempt++) {
    try { check(); return; } catch (error) { failure = error; }
    await delay(1000);
  }
  throw new Error(`${label} did not become ready`, { cause: failure });
}

function node(container, code) {
  return run("exec", container, "node", "--import", "tsx", "--input-type=module", "-e", code);
}

try {
  run("image", "inspect", image);
  run("pull", "postgres:16-alpine");
  run("pull", "redis:7-alpine");
  run("network", "create", "--internal", prefix);
  const postgres = start("postgres", ["--tmpfs", "/var/lib/postgresql/data", "-e", "POSTGRES_USER=smoke", "-e", "POSTGRES_PASSWORD=smoke", "-e", "POSTGRES_DB=smoke", "postgres:16-alpine"]);
  const redis = start("redis", ["--tmpfs", "/data", "redis:7-alpine", "redis-server", "--save", "", "--appendonly", "no"]);
  await until(() => run("exec", postgres, "pg_isready", "-U", "smoke"), "Postgres");
  await until(() => assert.equal(run("exec", redis, "redis-cli", "ping"), "PONG"), "Redis");

  const envArgs = Object.entries(runtimeEnv).flatMap(([key, value]) => ["-e", `${key}=${value}`]);
  const api = start("api", [...envArgs, image]);
  await until(() => node(api, `
    import assert from "node:assert/strict";
    const r = await fetch("http://localhost:4000/readyz", { signal: AbortSignal.timeout(2000) });
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), { ok: true, checks: { db: true, redis: true } });
  `), "API readiness");

  node(api, `
    import assert from "node:assert/strict";
    import { existsSync, readdirSync, writeFileSync, readFileSync, unlinkSync, statSync } from "node:fs";
    assert.notEqual(process.getuid(), 0);
    assert.ok(existsSync("dist/server.js"));
    assert.ok(!readdirSync("dist", { recursive: true }).some(p => p.endsWith(".test.js")));
    assert.ok(!existsSync(".env"));
    const path = "/app/private-media/smoke.txt";
    writeFileSync(path, "private", { mode: 0o600, flag: "wx" });
    assert.equal(readFileSync(path, "utf8"), "private");
    assert.equal(statSync(path).mode & 0o777, 0o600);
    unlinkSync(path);
    for (const [path, status, method] of [["/livez", 200, "GET"], ["/v1/orgs/mine", 401, "GET"], ["/metrics", 404, "GET"], ["/v1/auth/dev-login", 404, "POST"]]) {
      const r = await fetch("http://localhost:4000" + path, { method, signal: AbortSignal.timeout(2000) });
      assert.equal(r.status, status, path);
    }
    const cors = await fetch("http://localhost:4000/v1/orgs", { method: "OPTIONS", headers: { origin: "https://lms.eyf.invalid", "access-control-request-method": "GET" } });
    assert.equal(cors.headers.get("access-control-allow-origin"), "https://lms.eyf.invalid");
  `);
  console.log("PASS: API readiness, production access controls, private storage and clean runtime files");

  const workers = ["judge", "cron", "webhook"].map(name => start(name, ["--no-healthcheck", ...envArgs, image, "node", "--import", "tsx", `dist/jobs/${name}.worker.js`]));
  await until(() => node(api, `
    import assert from "node:assert/strict";
    import { Queue } from "bullmq";
    for (const name of ["judge", "cron", "webhook"]) {
      const queue = new Queue(name, { connection: { host: "redis", port: 6379 } });
      try {
        assert.equal((await queue.getWorkers()).length, 1, name);
        if (name === "cron") assert.equal((await queue.getJobSchedulers()).length, 5);
      } finally { await queue.close(); }
    }
  `), "Worker queue registration");
  console.log("PASS: judge, cron and webhook workers connected; five schedules registered");

  for (const container of [...workers, api]) {
    run("stop", "--time", "10", container);
    assert.equal(run("inspect", "--format", "{{.State.ExitCode}}", container), "0", `${container} graceful shutdown`);
  }
  console.log("PASS: all four production processes shut down cleanly");
} catch (error) {
  for (const container of containers.filter(id => !id.endsWith("-postgres") && !id.endsWith("-redis"))) {
    try { console.error(container, run("logs", "--tail", "35", container)); } catch { /* Container may not have started. */ }
  }
  throw error;
} finally {
  for (const container of containers.reverse()) {
    try { run("rm", "-f", "-v", container); } catch { /* Only this run's disposable resources. */ }
  }
  try { run("network", "rm", prefix); } catch { /* Network may not have been created. */ }
}
