"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { StaffLink } from "./staff-link";
import { Icons } from "./icons";
import { NAV_GROUPS } from "@/lib/nav";

const STORE_KEY = "eyf-nav-groups";

function groupOfPath(pathname: string): string | null {
  for (const g of NAV_GROUPS) {
    if (g.items.some((i) => pathname === i.href || pathname.startsWith(i.href + "/"))) return g.label;
  }
  return null;
}

/**
 * App navigation. Groups are collapsible (progressive disclosure): on first
 * visit only the group holding the current route is expanded, so the sidebar
 * presents ~6 section headers instead of 39 flat destinations at once
 * (Hick's Law). The user's expand/collapse choices persist; the active group
 * is always kept open so the current section never hides itself.
 */
export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const activeGroup = groupOfPath(pathname);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  // Hydrate saved preferences; fall back to "active group only".
  useEffect(() => {
    let saved: Record<string, boolean> | null = null;
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) saved = JSON.parse(raw) as Record<string, boolean>;
    } catch {}
    setOpen(saved ?? (activeGroup ? { [activeGroup]: true } : {}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The section you're in is always visible.
  useEffect(() => {
    if (activeGroup) setOpen((o) => (o[activeGroup] ? o : { ...o, [activeGroup]: true }));
  }, [activeGroup]);

  const toggle = (label: string) =>
    setOpen((o) => {
      const next = { ...o, [label]: !o[label] };
      try { localStorage.setItem(STORE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });

  return (
    <nav className="flex-1 px-3 py-4 space-y-1 text-sm overflow-y-auto">
      {NAV_GROUPS.map((g) => {
        const expanded = !!open[g.label];
        const panelId = `nav-${g.label.replace(/\s+/g, "-").toLowerCase()}`;
        return (
          <div key={g.label}>
            <button
              type="button"
              onClick={() => toggle(g.label)}
              aria-expanded={expanded}
              aria-controls={panelId}
              className="w-full flex items-center gap-2 px-3 min-h-11 lg:min-h-9 rounded-md text-[10px] font-mono uppercase tracking-widest text-text-3 hover:text-text-1 hover:bg-surface transition-colors"
            >
              <span className="flex-1 text-left">{g.label}</span>
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className={`shrink-0 transition-transform duration-200 ${expanded ? "" : "-rotate-90"}`}
                aria-hidden
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {expanded && (
              <div id={panelId} className="mt-0.5 mb-2 space-y-0.5">
                {g.items.map((i) => {
                  const active = pathname === i.href || pathname.startsWith(i.href + "/");
                  const Icon = Icons[i.icon];
                  return (
                    <Link
                      key={i.href}
                      href={i.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={`group relative flex items-center gap-2.5 px-3 min-h-11 lg:min-h-0 lg:py-1.5 rounded-md transition-colors ${
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
            )}
          </div>
        );
      })}
      <StaffLink onNavigate={onNavigate} />
    </nav>
  );
}
