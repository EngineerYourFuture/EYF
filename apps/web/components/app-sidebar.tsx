"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { StaffLink } from "./staff-link";
import { Icons } from "./icons";
import { NAV_GROUPS } from "@/lib/nav";

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 px-3 py-5 space-y-6 text-sm overflow-y-auto">
      {NAV_GROUPS.map((g) => (
        <div key={g.label}>
          <div className="px-3 mb-1.5 text-[10px] font-mono uppercase tracking-widest text-text-4">{g.label}</div>
          <div className="space-y-0.5">
            {g.items.map((i) => {
              const active = pathname === i.href || pathname.startsWith(i.href + "/");
              const Icon = Icons[i.icon];
              return (
                <Link
                  key={i.href}
                  href={i.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={`group relative flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-colors ${
                    active
                      ? "bg-accent-tint text-text-1 font-medium"
                      : "text-text-2 hover:bg-surface hover:text-text-1"
                  }`}
                >
                  {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 bg-accent rounded-r" />}
                  <Icon width={16} height={16} className={active ? "text-accent" : "text-text-3 group-hover:text-text-2"} />
                  {i.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
      <StaffLink onNavigate={onNavigate} />
    </nav>
  );
}
