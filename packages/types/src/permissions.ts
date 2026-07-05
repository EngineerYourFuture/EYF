/**
 * RBAC capability layer — the scalable core of the EYF admin/staff portal.
 *
 * Instead of hardcoding `role === "ADMIN"` checks across the codebase, every
 * privileged action declares a CAPABILITY, and each staff role maps to a set of
 * capabilities. Adding a new staff power = add a capability + map it to a role;
 * no user-facing code changes. Pure + shared so web (nav gating) and api
 * (route gating) agree on exactly one source of truth.
 */

export const CAPABILITIES = [
  "manage:content",     // CRUD problems, subjects, jobs, companies, tracks, experiences…
  "manage:users",       // list users, change role/plan, suspend
  "manage:payments",    // view subscriptions/transactions, issue refunds
  "moderate",           // forum/OA moderation + admin overview
  "verify:mentors",     // approve/reject mentor applications
  "view:analytics",     // admin dashboards + metrics + audit log
  "issue:certificates", // mint certificates for arbitrary users (ADMIN only)
] as const;

export type Capability = (typeof CAPABILITIES)[number];

/** Staff-side roles that can hold capabilities. Student tiers hold none. */
export type StaffRole = "ADMIN" | "CONTENT_CREATOR" | "MODERATOR";

/**
 * Role → capabilities. ADMIN (authority) holds everything; CONTENT_CREATOR
 * (staff) manages content and moderates. Extend here as new staff roles appear
 * — this map is the single place authority is defined.
 */
const ROLE_CAPABILITIES: Record<string, readonly Capability[]> = {
  ADMIN: CAPABILITIES,
  CONTENT_CREATOR: ["manage:content", "moderate"],
  MODERATOR: ["moderate"],
};

export function capabilitiesFor(role: string | null | undefined): readonly Capability[] {
  return role ? (ROLE_CAPABILITIES[role] ?? []) : [];
}

export function hasCapability(role: string | null | undefined, cap: Capability): boolean {
  return capabilitiesFor(role).includes(cap);
}

/** True for any role that can enter the admin portal at all. */
export function isStaffRole(role: string | null | undefined): boolean {
  return capabilitiesFor(role).length > 0;
}
