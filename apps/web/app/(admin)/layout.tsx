"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useRole } from "@/lib/use-role";

const adminNav = [
  { href: "/admin",         label: "Overview" },
  { href: "/admin/mentors", label: "Mentor queue" },
  { href: "/admin/forum",   label: "Forum" },
  { href: "/admin/oa",      label: "OA reports" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { loading, isStaff } = useRole();
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

  return (
    <div className="min-h-screen bg-bg">
      {/* Distinct admin chrome — visually separate from the student app. */}
      <header className="border-b border-border bg-surface/60 sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold tracking-tight">EYF</span>
            <span className="text-xs font-mono uppercase tracking-widest text-hard border border-hard/40 rounded px-1.5 py-0.5">Admin</span>
          </div>
          <nav className="flex items-center gap-1 text-sm ml-2">
            {adminNav.map((i) => {
              const active = i.href === "/admin" ? pathname === "/admin" : pathname.startsWith(i.href);
              return (
                <Link key={i.href} href={i.href}
                  className={`px-3 py-1.5 rounded-md transition-colors ${active ? "bg-surface text-text-1" : "text-text-3 hover:text-text-1"}`}>
                  {i.label}
                </Link>
              );
            })}
          </nav>
          <Link href="/dashboard" className="ml-auto text-sm text-text-3 hover:text-text-1">← Exit to app</Link>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
