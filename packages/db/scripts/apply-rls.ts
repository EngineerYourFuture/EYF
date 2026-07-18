/**
 * Postgres Row-Level Security backstop (PRD §25, isolation layer 2).
 *
 * Escape-hatch policy model: when a request has DECLARED an org context
 * (`SET LOCAL app.org_id = …`, see api withOrgContext), rows from any other
 * org become invisible even if application code forgot a filter. When no
 * context is set (admin console, cron workers, non-org paths), the policy
 * passes everything — RLS here is a tripwire for the dangerous class of bug
 * (org-scoped request leaking cross-tenant rows), not a replacement for the
 * orgDb() repository layer. FORCE is on so the table owner (the app user)
 * is also subject to the policies.
 *
 * Idempotent. Run: `pnpm --filter @eyf/db db:rls` (local + every deploy —
 * documented in docs/GO-LIVE.md).
 *
 * INVARIANT: only tables with a literal `orgId` column belong in ORG_TABLES.
 * A table isolated transitively (e.g. org_offers via reqId→JobRequisition)
 * must NOT be listed — the policy references "orgId" and would deny every
 * write on a column-less table. Route-level filtering isolates those.
 */
import { PrismaClient } from "../src/generated/client";
import { ORG_TABLES, TENANT_TABLE, POLICY_NAME } from "./rls-tables";

const prisma = new PrismaClient();

async function main() {
  for (const table of ORG_TABLES) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`);
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS ${POLICY_NAME} ON "${table}"`);
    await prisma.$executeRawUnsafe(
      `CREATE POLICY ${POLICY_NAME} ON "${table}"
       USING (current_setting('app.org_id', true) IS NULL
              OR current_setting('app.org_id', true) = ''
              OR "orgId" = current_setting('app.org_id', true))`,
    );
    console.log(`RLS: ${POLICY_NAME} applied on ${table}`);
  }
  // organizations itself: the row IS the tenant — same escape-hatch shape.
  await prisma.$executeRawUnsafe(`ALTER TABLE "${TENANT_TABLE}" ENABLE ROW LEVEL SECURITY`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "${TENANT_TABLE}" FORCE ROW LEVEL SECURITY`);
  await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS ${POLICY_NAME} ON "${TENANT_TABLE}"`);
  await prisma.$executeRawUnsafe(
    `CREATE POLICY ${POLICY_NAME} ON "${TENANT_TABLE}"
     USING (current_setting('app.org_id', true) IS NULL
            OR current_setting('app.org_id', true) = ''
            OR "id" = current_setting('app.org_id', true))`,
  );
  console.log(`RLS: ${POLICY_NAME} applied on ${TENANT_TABLE}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
