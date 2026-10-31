"use client";
import { useApi } from "./use-api";
import { capabilitiesFor, isStaffRole, type Capability } from "@eyf/types";

export type Role =
  | "GUEST" | "STUDENT_FREE" | "STUDENT_BASIC" | "STUDENT_PRO"
  | "STUDENT_ELITE" | "MENTOR" | "MODERATOR" | "CONTENT_CREATOR" | "ADMIN";

type MeRole = { user: { role: Role } | null };

/**
 * Reads the current user's role from /me and derives capabilities from the
 * shared RBAC map (@eyf/types/permissions) — web nav gating and api route
 * gating agree on exactly one source of truth.
 * `loading` is true until the role resolves — gate on it to avoid flashing
 * protected UI before the check completes.
 */
export function useRole() {
  const { data, isLoading, error } = useApi<MeRole>("/me");
  const role = data?.user?.role ?? null;
  return {
    role,
    loading: isLoading && !data && !error,
    isStaff: isStaffRole(role),
    isAdmin: role === "ADMIN",
    can: (cap: Capability) => capabilitiesFor(role).includes(cap),
  };
}
