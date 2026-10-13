import "dotenv/config";
import { existsSync } from "node:fs";
import { mkdtemp, mkdir, readdir, readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes, createHash } from "node:crypto";
import assert from "node:assert/strict";
import { env } from "../env.js";

// This drill only creates a fresh local recovery database. It never overwrites one.
const source = new URL(process.env.BACKUP_DATABASE_URL ?? env.DATABASE_URL);
if (!["localhost", "127.0.0.1", "[::1]"].includes(source.hostname)) throw new Error("Recovery drills are local-only. Use the deployment runbook for remote recovery.");
const target = `eyf_recovery_${randomBytes(8).toString("hex")}`;
const pgEnv = { ...process.env, PGHOST: source.hostname, PGPORT: source.port || "5432", PGUSER: decodeURIComponent(source.username), PGPASSWORD: decodeURIComponent(source.password), PGDATABASE: decodeURIComponent(source.pathname.slice(1)), PGCONNECT_TIMEOUT: "5" };
function run(tool: string, args: string[], database = pgEnv.PGDATABASE) {
  const executable = ["/opt/homebrew/bin", "/usr/local/bin", "/usr/bin"].map((base) => join(base, tool)).find(existsSync);
  if (!executable) throw new Error(`Install ${tool} before running the recovery drill.`);
  return execFileSync(executable, args, { env: { ...pgEnv, PGDATABASE: database }, encoding: "utf8", timeout: 60_000, stdio: ["ignore", "pipe", "pipe"] });
}
const counts = `SELECT json_build_object('users', (SELECT count(*) FROM users), 'courses', (SELECT count(*) FROM lms_courses), 'lessons', (SELECT count(*) FROM lms_lessons), 'uploads', (SELECT count(*) FROM lms_media_assets), 'invites', (SELECT count(*) FROM org_invites), 'migrations', (SELECT count(*) FROM _prisma_migrations));`;
let created = false;
let stage = "create a private temporary directory";
try {
  const folder = await mkdtemp(join(tmpdir(), "eyf-recovery-"));
  const dump = join(folder, "database.dump");
  stage = "read source counts";
  const before = run("psql", ["-X", "-At", "-v", "ON_ERROR_STOP=1", "-c", counts]).trim();
  stage = "dump the source database (backup role needs BYPASSRLS)";
  run("pg_dump", ["-Fc", "--no-owner", "--no-privileges", "-f", dump]);
  assert.ok(run("pg_restore", ["-l", dump]).includes("TABLE DATA"));
  stage = "create the fresh recovery database";
  run("psql", ["-X", "-v", "ON_ERROR_STOP=1", "-c", `CREATE DATABASE ${target}`], "postgres"); created = true;
  stage = "restore the database";
  run("pg_restore", ["--exit-on-error", "--no-owner", "--no-privileges", "-d", target, dump], target);
  stage = "compare restored records";
  assert.equal(run("psql", ["-X", "-At", "-v", "ON_ERROR_STOP=1", "-c", counts], target).trim(), before);
  const rls = run("psql", ["-X", "-At", "-c", "SELECT relrowsecurity AND relforcerowsecurity FROM pg_class WHERE relname='lms_media_assets';"], target).trim();
  assert.equal(rls, "t");
  console.log("PASS: database dump restored into a fresh local database; record counts and private-media RLS match.");
  if (existsSync(env.PRIVATE_MEDIA_DIR)) {
    const archive = join(folder, "private-media.tar"), restored = join(folder, "private-media"); await mkdir(restored, { mode: 0o700 });
    run("tar", ["-cf", archive, "-C", env.PRIVATE_MEDIA_DIR, "."]);
    run("tar", ["-xf", archive, "-C", restored]);
    const files = await readdir(env.PRIVATE_MEDIA_DIR);
    for (const file of files) {
      const hash = async (path: string) => createHash("sha256").update(await readFile(path)).digest("hex");
      assert.equal(await hash(join(restored, file)), await hash(join(env.PRIVATE_MEDIA_DIR, file)));
    }
    console.log(`PASS: ${files.length} private media files restored with matching hashes.`);
  } else console.log("INFO: no private media directory exists yet; database restoration verified.");
  console.log(`Local recovery artifacts: ${folder}`);
} catch { console.error(`FAIL: could not ${stage}. Check local PostgreSQL tooling, backup permissions and free disk space; credentials were not printed.`); process.exitCode = 1; }
finally {
  if (created) { try { run("psql", ["-X", "-v", "ON_ERROR_STOP=1", "-c", `DROP DATABASE ${target}`], "postgres"); } catch { console.error(`Cleanup needed: remove only the recovery database ${target}.`); process.exitCode = 1; } }
}
