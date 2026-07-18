/**
 * Deterministic permission-resolution engine — the composable core every
 * authorization source feeds into (OWASP Authorization Cheat Sheet: deny by
 * default, explicit deny is absolute, decisions are auditable).
 *
 * This is an ADDITIVE superset of the role-only choke point in
 * org-permissions.ts (`canInOrg`). It reuses that file's `orgGrantsFor` for the
 * role layer — role logic has ONE definition — and layers the remaining
 * enterprise sources on top:
 *
 *   role       — the member's OrgMember.roles[] (via orgGrantsFor)      [existing]
 *   group      — permission groups the member belongs to               [future: schema]
 *   direct     — per-member grants/denies (overrides)                  [future: schema]
 *   temporary  — time-boxed elevated access (expiresAt)                [future: schema]
 *   platform   — break-glass / kill-switch from platform operators     [future: schema]
 *
 * Sources beyond `role` are supplied as `entries`. With only roles this engine
 * returns EXACTLY what `canInOrg` returns (proven by authz.test.ts), so it can
 * back the middleware with zero behaviour change while the richer sources are
 * added incrementally — no second rewrite (see docs/AUTHORIZATION.md).
 *
 * RESOLUTION ORDER (deterministic):
 *   1. Drop expired entries (temporary access past its expiresAt).
 *   2. Any applicable DENY  → DENIED. Explicit deny cannot be overridden.
 *   3. Else any applicable ALLOW → GRANTED at the WIDEST scope.
 *   4. Else → DENIED (default deny).
 * Source precedence breaks ties (attribution + equal-scope allows) but NEVER
 * overrides deny-wins.
 */

import { orgGrantsFor, type OrgCapability, type OrgScope } from "./org-permissions";
import { isStaffRole } from "./permissions";

export type Effect = "allow" | "deny";

/** Where a permission entry came from. Ordered narrow → authoritative. */
export type GrantSource = "role" | "group" | "direct" | "temporary" | "platform";

const SOURCE_RANK: Record<GrantSource, number> = {
  role: 1,
  group: 2,
  direct: 3,
  temporary: 4,
  platform: 5,
};

const SCOPE_RANK: Record<OrgScope, number> = { own: 0, mentees: 1, team: 2, department: 3, org: 4 };

/**
 * A single permission fact from one source. `scope` applies to allows only.
 * `expiresAt` (epoch ms) time-boxes the entry — used for temporary access;
 * null/undefined means it never expires.
 */
export type PermissionEntry = {
  capability: OrgCapability;
  effect: Effect;
  scope?: OrgScope;
  source: GrantSource;
  expiresAt?: number | null;
  /** Human-readable justification, surfaced in audit logs. */
  reason?: string;
};

export type ResolveInput = {
  /** OrgMember.roles[] — expanded through the shared role→capability map. */
  roles?: readonly string[];
  /** Non-role facts: group/direct/temporary/platform grants and denies. */
  entries?: readonly PermissionEntry[];
  /** Injectable clock (epoch ms) for deterministic expiry tests. */
  now?: number;
};

export type AccessDecision =
  | { granted: false; effect: "deny"; source: GrantSource | "default"; reason: string }
  | { granted: true; effect: "allow"; scope: OrgScope; source: GrantSource; reason: string };

/** Expand a member's roles into role-sourced allow entries (reuses orgGrantsFor). */
function roleEntries(roles: readonly string[]): PermissionEntry[] {
  const grants = orgGrantsFor(roles);
  return (Object.entries(grants) as [OrgCapability, { scope: OrgScope }][]).map(
    ([capability, grant]) => ({
      capability,
      effect: "allow" as const,
      scope: grant.scope,
      source: "role" as const,
      reason: `role grant (${grant.scope})`,
    }),
  );
}

function isLive(entry: PermissionEntry, now: number): boolean {
  return entry.expiresAt == null || entry.expiresAt > now;
}

/**
 * THE authorization decision. Deterministic, auditable, deny-by-default.
 * Returns the reach (scope) so the caller applies it as a row filter — the
 * two-step contract: this decides, the repository filters.
 */
export function resolveOrgAccess(capability: OrgCapability, input: ResolveInput): AccessDecision {
  const now = input.now ?? Date.now();
  const applicable = [
    ...roleEntries(input.roles ?? []),
    ...(input.entries ?? []),
  ].filter((e) => e.capability === capability && isLive(e, now));

  // 2. Explicit deny is absolute — highest-precedence deny wins attribution.
  const denies = applicable.filter((e) => e.effect === "deny");
  if (denies.length > 0) {
    const top = denies.reduce((a, b) => (SOURCE_RANK[b.source] > SOURCE_RANK[a.source] ? b : a));
    return {
      granted: false,
      effect: "deny",
      source: top.source,
      reason: top.reason ?? `explicit deny (${top.source})`,
    };
  }

  // 3. Any allow → widest scope; ties broken by source precedence.
  const allows = applicable.filter((e) => e.effect === "allow");
  if (allows.length > 0) {
    const best = allows.reduce((a, b) => {
      const sa = SCOPE_RANK[a.scope ?? "own"];
      const sb = SCOPE_RANK[b.scope ?? "own"];
      if (sb !== sa) return sb > sa ? b : a;
      return SOURCE_RANK[b.source] > SOURCE_RANK[a.source] ? b : a;
    });
    return {
      granted: true,
      effect: "allow",
      scope: best.scope ?? "own",
      source: best.source,
      reason: best.reason ?? `allow (${best.source})`,
    };
  }

  // 4. Default deny.
  return { granted: false, effect: "deny", source: "default", reason: "no matching grant (default deny)" };
}

/** Boolean convenience. */
export function isAllowed(capability: OrgCapability, input: ResolveInput): boolean {
  return resolveOrgAccess(capability, input).granted;
}

// ── Layer 6: composable, named policies ────────────────────────────────
// Thin, self-documenting wrappers over the engine — one per real capability so
// call sites read as intent ("can this actor invite a member?") and audit logs
// carry the policy name. Only capabilities that exist in ORG_CAPABILITIES are
// modelled here; no invented permissions.

export type Policy = (input: ResolveInput) => AccessDecision;

const policy = (capability: OrgCapability): Policy => (input) => resolveOrgAccess(capability, input);

export const CanManageOrg = policy("org:manage");
export const CanViewBilling = policy("org:billing");
export const CanInviteMember = policy("org:members");
export const CanViewAudit = policy("org:audit");
export const CanManageBranding = policy("org:branding");
export const CanAuthorCourse = policy("learn:author");
export const CanPublishCourse = policy("learn:publish");
export const CanEnrollLearners = policy("learn:enroll");
export const CanAuthorAssessment = policy("assess:author");
export const CanGradeAssessment = policy("assess:grade");
export const CanViewResults = policy("assess:view-results");
export const CanReadSkills = policy("people:skills-read");
export const CanSearchTalent = policy("talent:search");
export const CanManagePipeline = policy("hire:pipeline");
export const CanMakeOffer = policy("hire:offer");
export const CanViewOrgReports = policy("reports:org");

// ── Layer 1: platform vs. tenant role separation ───────────────────────
// Platform authority lives on `User.role` (a single enum) and is resolved by
// the STAFF capability engine (permissions.ts). Tenant authority lives on
// `OrgMember.roles[]` and is resolved by THIS engine + org-permissions.ts.
// They are separate namespaces stored in separate columns and evaluated by
// separate engines — a platform role is never consulted for an org decision
// and vice versa. Note the name "ADMIN" exists in both namespaces but is a
// different grant in each; they never cross because the engines never share
// input. This helper makes the separation explicit and testable.

/** The org (tenant) role namespace — mirrors OrgRoleName in org-permissions.ts. */
export const ORG_ROLE_NAMES = [
  "OWNER", "ADMIN", "HR", "RECRUITER", "LND", "ENG_MANAGER",
  "INSTRUCTOR", "MENTOR", "REVIEWER", "MEMBER", "INTERN",
] as const;

const ORG_ROLE_SET: ReadonlySet<string> = new Set(ORG_ROLE_NAMES);

/** True if `role` names a tenant (OrgMember) role. */
export function isOrgRoleName(role: string): boolean {
  return ORG_ROLE_SET.has(role);
}

/** True if `role` carries PLATFORM (staff-portal) authority — never a tenant grant. */
export function isPlatformRole(role: string): boolean {
  return isStaffRole(role);
}

/**
 * Guard for assigning roles onto an OrgMember. Only tenant role names are
 * valid there; a platform role string must never be persisted as an org role
 * (defence against privilege confusion / confused-deputy). Returns the
 * offending values so the caller can 400 with a precise message.
 */
export function invalidTenantRoles(roles: readonly string[]): string[] {
  return roles.filter((r) => !isOrgRoleName(r));
}
