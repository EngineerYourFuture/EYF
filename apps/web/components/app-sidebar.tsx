"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { StaffLink } from "./staff-link";

type Item = { href: string; label: string };
type Group = { label: string; items: Item[] };

const GROUPS: Group[] = [
  {
    label: "Practice",
    items: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/problems", label: "Problems" },
      { href: "/visualizer", label: "Visualizer" },
      { href: "/games", label: "Cognitive Games" },
      { href: "/pressure", label: "Pressure Mode" },
    ],
  },
  {
    label: "Learn",
    items: [
      { href: "/tracks", label: "Career Tracks" },
      { href: "/subjects", label: "Core Subjects" },
      { href: "/assessment", label: "Assessment" },
      { href: "/roadmap", label: "Roadmap" },
    ],
  },
  {
    label: "Interview",
    items: [
      { href: "/mocks", label: "AI Mocks" },
      { href: "/peer-mocks", label: "Peer Mocks" },
      { href: "/code-dna", label: "Code DNA" },
      { href: "/oa", label: "OA Fingerprint" },
    ],
  },
  {
    label: "Career",
    items: [
      { href: "/resume", label: "Resume" },
      { href: "/projects", label: "Projects" },
      { href: "/internships", label: "Internships" },
      { href: "/jobs", label: "Jobs" },
      { href: "/mentors", label: "Mentors" },
    ],
  },
  {
    label: "More",
    items: [
      { href: "/forum", label: "Community" },
      { href: "/wrapped", label: "Wrapped" },
      { href: "/certificates", label: "Certificates" },
      { href: "/fun", label: "Roast + Offer" },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/billing", label: "Billing" },
      { href: "/settings", label: "Settings" },
    ],
  },
];

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 px-3 py-5 space-y-6 text-sm overflow-y-auto">
      {GROUPS.map((g) => (
        <div key={g.label}>
          <div className="px-3 mb-1.5 text-[10px] font-mono uppercase tracking-widest text-text-4">{g.label}</div>
          <div className="space-y-0.5">
            {g.items.map((i) => {
              const active = pathname === i.href || pathname.startsWith(i.href + "/");
              return (
                <Link
                  key={i.href}
                  href={i.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={`relative block px-3 py-1.5 rounded-md transition-colors ${
                    active
                      ? "bg-accent-tint text-text-1 font-medium"
                      : "text-text-2 hover:bg-surface hover:text-text-1"
                  }`}
                >
                  {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 bg-accent rounded-r" />}
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
