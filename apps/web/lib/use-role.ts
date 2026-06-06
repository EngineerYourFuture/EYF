"use client";
import { useApi } from "./use-api";

export type Role =
  | "GUEST" | "STUDENT_FREE" | "STUDENT_BASIC" | "STUDENT_PRO"
  | "STUDENT_ELITE" | "MENTOR" | "CONTENT_CREATOR" | "ADMIN";

type MeRole = { user: { role: Role } | null };

const STAFF: Role[] = ["ADMIN", "CONTENT_CREATOR"];

/**
 * Reads the current user's role from /me.
 * `loading` is true until the role resolves — gate on it to avoid flashing
 * protected UI before the check completes.
 */
export function useRole() {
  const { data, isLoading, error } = useApi<MeRole>("/me");
  const role = data?.user?.role ?? null;
  return {
    role,
    loading: isLoading && !data && !error,
    isStaff: role ? STAFF.includes(role) : false,
    isAdmin: role === "ADMIN",
  };
}
