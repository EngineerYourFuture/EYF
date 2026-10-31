"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useRole } from "@/lib/use-role";
import { useAdminGate, AdminGate } from "@/components/admin-gate";

import type { Capability } from "@eyf/types";

// Each section declares the capability it needs — the nav only shows what the
// signed-in staff role can actually do (api routes enforce the same map).
const adminNav: { href: string; label: string; cap: Capability }[] = [
  { href: "/admin",                  label: "Overview",     cap: "moderate" },
  { href: "/admin/content/problems", label: "Content",      cap: "manage:content" },
  { href: "/admin/users",            label: "Users",        cap: "manage:users" },
  { href: "/admin/organizations", label: "LMS organizations", cap: "manage:users" },
  { href: "/admin/payments",         label: "Payments",     cap: "manage:payments" },
  { href: "/admin/mentors",          label: "Mentor queue", cap: "verify:mentors" },
  { href: "/admin/forum",            label: "Forum",        cap: "moderate" },
  { href: "/admin/oa",               label: "OA reports",   cap: "moderate" },
  { href: "/admin/operations", label: "Operations", cap: "view:analytics" },
  { href: "/admin/audit",            label: "Audit",        cap: "view:analytics" },
];

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { loading, isStaff, can } = useRole();
  const gate = useAdminGate(!loading && isStaff);
  const router = useRouter();
  const pathname = usePathname();

  // Client-side role gate (defense in depth — every admin API is role-gated too).
  useEffect(() => {
    if (!loading && !isStaff) router.replace("/dashboard");
  }, [loading, isStaff, router]);

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-text-3">Checking access…</div>;
  }
  if (!isStaff) {
    return (
      <div className="min-h-screen grid place-items-center text-center px-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Restricted</h1>
          <p className="text-text-3 mt-2">This area is for EYF staff. Redirecting…</p>
          <Link href="/dashboard" className="text-accent text-sm mt-4 inline-block">Back to dashboard →</Link>
        </div>
      </div>
    );
  }

  // Second factor: the admin access-code gate (when configured server-side).
  if (gate.loading) {
    return <div className="min-h-screen grid place-items-center text-text-3">Checking access…</div>;
  }
  if (gate.required && !gate.passed) {
    return <AdminGate onPassed={() => gate.refresh()} />;
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Distinct admin chrome — visually separate from the student app. */}
      <header className="border-b border-border bg-surface/60 sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 min-h-14 flex flex-wrap items-center gap-x-4 gap-y-1 py-2">
          <div className="flex shrink-0 items-center gap-2">
            <span className="font-display font-bold tracking-tight">EYF</span>
            <span className="text-xs font-mono uppercase tracking-widest text-hard border border-hard/40 rounded px-1.5 py-0.5">Admin</span>
          </div>
          <nav aria-label="Admin sections" className="order-3 w-full min-w-0 overflow-x-auto flex items-center gap-1 text-sm lg:order-none lg:flex-1 lg:w-auto">
            {adminNav.filter((i) => can(i.cap)).map((i) => {
              const active = i.href === "/admin" ? pathname === "/admin" : pathname.startsWith(i.href);
              return (
                <Link key={i.href} href={i.href}
                  className={`shrink-0 whitespace-nowrap min-h-11 inline-flex items-center px-3 py-1.5 rounded-md transition-colors ${active ? "bg-surface text-text-1" : "text-text-3 hover:text-text-1"}`}>
                  {i.label}
                </Link>
              );
            })}
          </nav>
          <Link href="/dashboard" className="ml-auto shrink-0 min-h-11 inline-flex items-center text-sm text-text-3 hover:text-text-1">← Exit to app</Link>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
