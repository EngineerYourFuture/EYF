/**
 * RLS verification gate — asserts tenant isolation is not just configured but
 * ACTUALLY ENFORCED. Run after apply-rls.ts on every deploy; exits non-zero to
 * fail the pipeline.
 *
 * Checks, per isolated table:
 *   1. relrowsecurity     — RLS enabled
 *   2. relforcerowsecurity — enforced against the table owner too
 *   3. the org_isolation policy exists
 *
 * Plus one whole-database check that the per-table flags cannot express:
 *   4. the connecting role is neither SUPERUSER nor BYPASSRLS.
 *
 * Check 4 is the one that matters most. Postgres silently ignores RLS for
 * superusers and BYPASSRLS roles — every policy can be perfectly configured and
 * still filter nothing. A dev container (POSTGRES_USER=eyf) is a superuser, so
 * this is a warning by default; pass RLS_STRICT=true (production/CD) to make it
 * a hard failure. That flag is the difference between "policies exist" and
 * "policies enforce".
 *
 * Run: pnpm --filter @eyf/db db:rls:verify
 */
import { PrismaClient } from "../src/generated/client";
import { ORG_TABLES, TENANT_TABLE, ALL_ISOLATED_TABLES, POLICY_NAME } from "./rls-tables";

const prisma = new PrismaClient();
const STRICT = process.env.RLS_STRICT === "true";

type TableState = {
  relname: string;
  relrowsecurity: boolean;
  relforcerowsecurity: boolean;
  policies: bigint | number;
};

type RoleState = {
  current_user: string;
  rolsuper: boolean;
  rolbypassrls: boolean;
};

const failures: string[] = [];
const warnings: string[] = [];

async function checkRole(): Promise<void> {
  const [role] = await prisma.$queryRawUnsafe<RoleState[]>(
    `SELECT current_user::text AS current_user,
            COALESCE((SELECT rolsuper     FROM pg_roles WHERE rolname = current_user), false) AS rolsuper,
            COALESCE((SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user), false) AS rolbypassrls`,
  );
  if (!role) {
    failures.push("Could not resolve the connecting role.");
    return;
  }

  const bypasses = role.rolsuper || role.rolbypassrls;
  if (!bypasses) {
    console.log(`  ✓ role "${role.current_user}" is subject to RLS (not superuser, no BYPASSRLS)`);
    return;
  }

  const detail =
    `role "${role.current_user}" ${role.rolsuper ? "is a SUPERUSER" : "has BYPASSRLS"} — ` +
    `Postgres skips every RLS policy for it, so tenant isolation is NOT enforced on this connection.`;

  if (STRICT) {
    failures.push(detail);
  } else {
    warnings.push(
      `${detail}\n    This is expected for the local/CI dev container (POSTGRES_USER=eyf).\n` +
      `    Production MUST connect as a non-superuser role without BYPASSRLS.\n` +
      `    Set RLS_STRICT=true to make this a hard failure.`,
    );
  }
}

async function checkTables(): Promise<void> {
  const rows = await prisma.$queryRawUnsafe<TableState[]>(
    `SELECT c.relname::text                    AS relname,
            c.relrowsecurity                   AS relrowsecurity,
            c.relforcerowsecurity              AS relforcerowsecurity,
            (SELECT count(*) FROM pg_policy p
              WHERE p.polrelid = c.oid AND p.polname = $1) AS policies
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = ANY($2::text[])`,
    POLICY_NAME,
    [...ALL_ISOLATED_TABLES],
  );

  const byName = new Map(rows.map((r) => [r.relname, r]));

  for (const table of ALL_ISOLATED_TABLES) {
    const state = byName.get(table);
    if (!state) {
      failures.push(`${table}: table not found — expected an isolated table (has the migration run?)`);
      continue;
    }
    const problems: string[] = [];
    if (!state.relrowsecurity) problems.push("RLS not ENABLED");
    if (!state.relforcerowsecurity) problems.push("RLS not FORCED (table owner would bypass it)");
    if (Number(state.policies) === 0) problems.push(`policy "${POLICY_NAME}" missing`);

    if (problems.length) {
      failures.push(`${table}: ${problems.join("; ")}`);
    } else {
      console.log(`  ✓ ${table}`);
    }
  }
}

async function main() {
  console.log(`RLS verification — ${ALL_ISOLATED_TABLES.length} isolated tables (${ORG_TABLES.length} org-scoped + ${TENANT_TABLE})`);
  console.log(`Mode: ${STRICT ? "STRICT (production)" : "advisory (set RLS_STRICT=true to enforce)"}\n`);

  await checkRole();
  await checkTables();

  if (warnings.length) {
    console.warn("\n⚠ Warnings:");
    for (const w of warnings) console.warn(`  - ${w}`);
  }

  if (failures.length) {
    console.error(`\n✖ RLS verification FAILED — ${failures.length} problem(s):`);
    for (const f of failures) console.error(`  - ${f}`);
    console.error(`\nTenant isolation is not enforced. Run \`pnpm --filter @eyf/db db:rls\` and re-verify.`);
    console.error(`Refusing to proceed — this gate exists so a cross-tenant leak cannot ship.`);
    throw new Error("RLS verification failed");
  }

  console.log(`\n✓ RLS verified on all ${ALL_ISOLATED_TABLES.length} isolated tables.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    if (!(e instanceof Error && e.message === "RLS verification failed")) console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
