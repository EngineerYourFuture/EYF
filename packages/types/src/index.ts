// Shared transport types — used by both web and api.
// Keep aligned with the API contract in specs/EYF_Master_Docs_Final.md Doc 12.

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: { page?: number; total?: number; cursor?: string };
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
    upgradeRequired?: boolean;
    plan?: "basic" | "pro" | "elite";
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type Plan = "free" | "basic" | "pro" | "elite";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role:
    | "GUEST"
    | "STUDENT_FREE"
    | "STUDENT_BASIC"
    | "STUDENT_PRO"
    | "STUDENT_ELITE"
    | "MENTOR"
    | "MODERATOR"
    | "CONTENT_CREATOR"
    | "ADMIN";
  plan: Plan;
};

// Submission rate limits per spec (per-day).
export const SUBMISSION_LIMITS: Record<Plan, number> = {
  free: 5,
  basic: 20,
  pro: Number.POSITIVE_INFINITY,
  elite: Number.POSITIVE_INFINITY,
};

// Per-minute rate limits per spec.
export const RATE_LIMIT_PER_MIN: Record<Plan, number> = {
  free: 60,
  basic: 180,
  pro: 600,
  elite: 1200,
};

// Plan tiers ordered low → high.
export const PLAN_RANK: Record<Plan, number> = { free: 0, basic: 1, pro: 2, elite: 3 };

/**
 * Does `userPlan` satisfy a requirement of `requiredPlans`?
 * The lowest tier in `requiredPlans` is the minimum; anyone at or above it passes.
 * `requirePlan(["pro"])` → "pro or above". Empty list → always passes.
 * Returns the minimum tier required (for the upgrade prompt) when it fails.
 */
export function meetsPlan(
  userPlan: Plan,
  requiredPlans: Plan[],
): { ok: true } | { ok: false; minRequired: Plan } {
  if (requiredPlans.length === 0) return { ok: true };
  const minRequired = requiredPlans.reduce(
    (lo, p) => (PLAN_RANK[p] < PLAN_RANK[lo] ? p : lo),
    requiredPlans[0]!,
  );
  return PLAN_RANK[userPlan] >= PLAN_RANK[minRequired]
    ? { ok: true }
    : { ok: false, minRequired };
}

// ─── Resume JSON schema (shared by ATS scorer + builder UI) ───────

export type ResumeDocument = {
  contact: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    github?: string;
    linkedin?: string;
    portfolio?: string;
  };
  summary?: string;
  skills?: string[];
  experience?: {
    company: string;
    role: string;
    start: string;
    end?: string;
    bullets: string[];
  }[];
  projects?: {
    name: string;
    description: string;
    link?: string;
    techStack?: string[];
  }[];
  education?: {
    institution: string;
    degree: string;
    start: string;
    end?: string;
    gpa?: string;
  }[];
  achievements?: string[];
};

// ─── XP & level curve ─────────────────────────────────────────────

export const XP_PER_VERDICT = {
  easy:   25,
  medium: 60,
  hard:  150,
  expert: 300,
};
export const STREAK_BONUS = 10; // per day in a streak
export function xpForLevel(level: number): number {
  // Quadratic curve: L1→0, L2→100, L3→300, L4→600, …
  return Math.round(50 * level * (level - 1));
}
export function levelForXp(xp: number): number {
  let l = 1;
  while (xpForLevel(l + 1) <= xp) l += 1;
  return l;
}

// Placement Readiness + Guidance intelligence layer (pure, shared web+api).
// EXPLICIT named re-exports (not `export *`): esbuild transpiles each file
// independently, so a star re-export can't be statically linked by Node's ESM
// linker under `tsx watch`. Extensionless (not `.js`): tsx resolves it, and
// Next's webpack resolves `./readiness`->`.ts` — a `.js` specifier would break
// the web build (no readiness.js exists). Named + extensionless satisfies both.
export { computeReadiness, rankActions } from "./readiness";
export type {
  ReadinessInput,
  ReadinessGoal,
  Readiness,
  Pillar,
  GuidanceAction,
} from "./readiness";

// RBAC capability layer (admin/staff portal — scalable, shared web+api).
export { CAPABILITIES, capabilitiesFor, hasCapability, isStaffRole } from "./permissions";
export type { Capability, StaffRole } from "./permissions";

export { buildIceServers, type IceServer } from "./webrtc";

// Org-scoped RBAC+ABAC (enterprise platform — PRD §9). Named re-exports per
// the tsx-watch linker note above.
export {
  ORG_CAPABILITIES,
  orgGrantsFor,
  canInOrg,
  hasOrgCapability,
  isOrgStaff,
  canGrantRoles,
} from "./org-permissions";
export type { OrgCapability, OrgRoleName, OrgScope, OrgDecision } from "./org-permissions";

// Skill Ledger (enterprise evidence layer — PRD §15.13). Named re-exports.
export { computeSkillLevel, barFit, EVIDENCE_WEIGHT } from "./skill-ledger";
export type { Evidence, SkillLevel, RoleBarReq, BarGap } from "./skill-ledger";
