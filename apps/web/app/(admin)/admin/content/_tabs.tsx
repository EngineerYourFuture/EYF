"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin/content/problems", label: "Problems" },
  { href: "/admin/content/jobs", label: "Jobs" },
  { href: "/admin/content/career-tracks", label: "Career tracks" },
  { href: "/admin/content/experiences", label: "Experiences" },
];

/** Sub-nav shared across the content-management pages. */
export function ContentTabs() {
  const pathname = usePathname();
  return (
    <div className="flex items-center gap-1 mt-4 border-b border-border">
      {tabs.map((t) => {
        const active = pathname.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href}
            className={`px-3 py-2 text-sm border-b-2 -mb-px transition-colors ${active ? "border-accent text-text-1" : "border-transparent text-text-3 hover:text-text-1"}`}>
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
