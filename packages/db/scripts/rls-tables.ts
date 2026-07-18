/**
 * The tenant-isolation table list — the single source of truth for RLS.
 *
 * apply-rls.ts writes the policies; verify-rls.ts asserts they are present and
 * actually enforced. Both import THIS list, so the two can never drift — a
 * table applied but not verified (or vice versa) would be a silent isolation
 * hole, which is exactly the failure mode RLS exists to prevent.
 *
 * INVARIANT: only tables with a literal `orgId` column belong in ORG_TABLES.
 * A table isolated transitively (e.g. org_offers via reqId→JobRequisition)
 * must NOT be listed — the policy references "orgId" and would deny every
 * write on a column-less table. Route-level filtering isolates those.
 */

/** Org-scoped tables keyed by a literal `orgId` column. */
export const ORG_TABLES = [
  "org_members",
  "org_departments",
  "org_teams",
  "org_invites",
  "org_usage_counters",
  "org_learning_paths",
  "org_cohorts",
  "org_role_bars",
  "org_assessment_blueprints",
  "org_assessment_runs",
  "org_certificate_templates",
  "org_requisitions",
  "org_api_keys",
  "org_webhook_endpoints",
  // org_offers: no orgId column — isolated via reqId→JobRequisition; RLS N/A.
  "lms_courses",
  "internship_slots",
] as const;

/** `organizations` is isolated too, but the row IS the tenant — keyed on `id`. */
export const TENANT_TABLE = "organizations";

/** The policy name applied to every isolated table. */
export const POLICY_NAME = "org_isolation";

/** Every table that must carry the isolation policy. */
export const ALL_ISOLATED_TABLES: readonly string[] = [...ORG_TABLES, TENANT_TABLE];
