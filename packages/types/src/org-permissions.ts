/**
 * Org-scoped RBAC + ABAC — the enterprise platform's single policy choke point
 * (PRD §9, §25). Pure and shared: web nav gating and api route gating read the
 * SAME map, exactly like the staff-portal capability layer.
 *
 * RBAC answers "may this role ever do this?" via ORG_ROLE_CAPABILITIES.
 * ABAC narrows "over which rows?" via a scope: capabilities marked `scoped`
 * grant department/team/mentee/own reach for line roles and org-wide reach
 * for org roles. Callers MUST apply the returned scope as a query filter —
 * `can()` deciding and the repository filtering is the two-step contract.
 */

export const ORG_CAPABILITIES = [
  "org:manage",
  "org:billing",
  "org:members",
  "org:audit",
  "org:branding",
  "learn:author",
  "learn:publish",
  "learn:enroll",
  "learn:teach",
  "learn:review",
  "assess:author",
  "assess:administer",
  "assess:grade",
  "assess:view-results",
  "people:skills-read",
  "mentor:mentees",
  "talent:search",
  "hire:pipeline",
  "hire:offer",
  "reports:team",
  "reports:org",
] as const;

export type OrgCapability = (typeof ORG_CAPABILITIES)[number];

export type OrgRoleName =
  | "OWNER" | "ADMIN" | "HR" | "RECRUITER" | "LND" | "ENG_MANAGER"
  | "INSTRUCTOR" | "MENTOR" | "REVIEWER" | "MEMBER" | "INTERN";

/** How far a granted capability reaches. Ordered narrow → wide. */
export type OrgScope = "own" | "mentees" | "team" | "department" | "org";

type Grant = { scope: OrgScope };
type RoleGrants = Partial<Record<OrgCapability, Grant>>;

const ORG: Grant = { scope: "org" };
const DEPT: Grant = { scope: "department" };
const MENTEES: Grant = { scope: "mentees" };
const OWN: Grant = { scope: "own" };

/**
 * PRD §9 matrix, verbatim. Footnote rules that are *workflow* constraints
 * (two-person publish, offer approval chain, OWNER-only role grants) are
 * enforced in routes, not here — this map answers reach, not ceremony.
 */
const ORG_ROLE_CAPABILITIES: Record<OrgRoleName, RoleGrants> = {
  OWNER: Object.fromEntries(ORG_CAPABILITIES.map((c) => [c, ORG])) as RoleGrants,
  ADMIN: Object.fromEntries(
    ORG_CAPABILITIES.filter((c) => c !== "org:billing").map((c) => [c, ORG]),
  ) as RoleGrants,
  HR: {
    "org:members": ORG,
    "learn:enroll": ORG,
    "assess:administer": ORG,
    "assess:view-results": ORG,
    "people:skills-read": ORG,
    "talent:search": ORG,
    "hire:pipeline": ORG,
    "hire:offer": ORG,
    "reports:team": ORG,
    "reports:org": ORG,
  },
  RECRUITER: {
    "assess:administer": ORG,
    "assess:view-results": ORG, // hiring runs only — route-level purpose filter
    "talent:search": ORG,
    "hire:pipeline": ORG,
  },
  LND: {
    "learn:author": ORG,
    "learn:publish": ORG,
    "learn:enroll": ORG,
    "learn:teach": ORG,
    "assess:author": ORG,
    "assess:administer": ORG,
    "assess:grade": ORG,
    "assess:view-results": ORG,
    "people:skills-read": ORG,
    "reports:team": ORG,
    "reports:org": ORG,
  },
  ENG_MANAGER: {
    "learn:enroll": DEPT,
    "assess:administer": DEPT,
    "assess:view-results": DEPT,
    "people:skills-read": DEPT,
    "talent:search": ORG,
    "hire:pipeline": ORG,
    "reports:team": DEPT,
  },
  INSTRUCTOR: {
    "learn:author": ORG,
    "learn:teach": ORG,
    "assess:author": ORG,
    "assess:grade": ORG,
    "assess:view-results": OWN, // own courses/cohorts — route filters by authorship
    "reports:team": OWN,
  },
  MENTOR: {
    "learn:teach": ORG,
    "assess:view-results": MENTEES,
    "people:skills-read": MENTEES,
    "mentor:mentees": MENTEES,
    "reports:team": MENTEES,
  },
  REVIEWER: {
    "assess:grade": ORG,
    "assess:view-results": OWN, // items they graded
    "learn:review": ORG,
  },
  MEMBER: {
    "assess:view-results": OWN,
    "people:skills-read": OWN,
  },
  INTERN: {
    "assess:view-results": OWN,
    "people:skills-read": OWN,
  },
};

const SCOPE_RANK: Record<OrgScope, number> = { own: 0, mentees: 1, team: 2, department: 3, org: 4 };

/** Union of grants across a member's roles; widest scope wins per capability. */
export function orgGrantsFor(roles: readonly string[]): RoleGrants {
  const out: RoleGrants = {};
  for (const r of roles) {
    const grants = ORG_ROLE_CAPABILITIES[r as OrgRoleName];
    if (!grants) continue;
    for (const [cap, grant] of Object.entries(grants) as [OrgCapability, Grant][]) {
      const existing = out[cap];
      if (!existing || SCOPE_RANK[grant.scope] > SCOPE_RANK[existing.scope]) out[cap] = grant;
    }
  }
  return out;
}

export type OrgDecision =
  | { granted: false }
  | { granted: true; scope: OrgScope };

/**
 * THE choke point. Every org route asks this and nothing else.
 * Returns the reach so the caller can filter rows (ABAC step two).
 */
export function canInOrg(roles: readonly string[], capability: OrgCapability): OrgDecision {
  const grant = orgGrantsFor(roles)[capability];
  return grant ? { granted: true, scope: grant.scope } : { granted: false };
}

export function hasOrgCapability(roles: readonly string[], capability: OrgCapability): boolean {
  return canInOrg(roles, capability).granted;
}

/** Roles that may enter the /org console at all (vs /work-only members). */
export function isOrgStaff(roles: readonly string[]): boolean {
  return roles.some((r) => r !== "MEMBER" && r !== "INTERN" && r in ORG_ROLE_CAPABILITIES);
}

/** Workflow rule (PRD §9 approval hierarchy): only OWNER grants/revokes
 *  ADMIN or OWNER; ADMIN may manage all lesser roles. */
export function canGrantRoles(actorRoles: readonly string[], targetRoles: readonly string[]): boolean {
  const elevated = targetRoles.some((r) => r === "OWNER" || r === "ADMIN");
  if (elevated) return actorRoles.includes("OWNER");
  return actorRoles.includes("OWNER") || actorRoles.includes("ADMIN") || actorRoles.includes("HR");
}
