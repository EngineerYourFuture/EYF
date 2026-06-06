"use client";
import Link from "next/link";
import { useRole } from "@/lib/use-role";

/**
 * Sidebar entry to the admin area — only rendered for staff (ADMIN /
 * CONTENT_CREATOR). Non-staff users never see the link, and the admin
 * route itself re-checks the role (and the API gates every action).
 */
export function StaffLink({ onNavigate }: { onNavigate?: () => void }) {
  const { isStaff } = useRole();
  if (!isStaff) return null;
  return (
    <Link
      href="/admin"
      onClick={onNavigate}
      className="mt-2 block px-3 py-2 rounded-md text-hard hover:bg-surface border border-hard/20"
    >
      ⚙ Admin
    </Link>
  );
}
