import type { IconName } from "@/components/icons";

export type NavItem = { href: string; label: string; icon: IconName; keywords?: string };
export type NavGroup = { label: string; items: NavItem[] };

/** Single source of truth for app navigation — used by the sidebar and the ⌘K palette. */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Practice",
    items: [
      { href: "/today", label: "Today", icon: "bolt", keywords: "daily plan agenda focus" },
      { href: "/dashboard", label: "Dashboard", icon: "home", keywords: "home overview" },
      { href: "/readiness", label: "Readiness", icon: "target", keywords: "placement ready score am i ready gaps progress" },
      { href: "/problems", label: "Problems", icon: "code", keywords: "dsa coding leetcode solve" },
      { href: "/visualizer", label: "Visualizer", icon: "activity", keywords: "algorithm animation sort bst graph" },
      { href: "/games", label: "Cognitive Games", icon: "brain", keywords: "reaction n-back stroop aptitude" },
      { href: "/pressure", label: "Pressure Mode", icon: "gauge", keywords: "timed anxiety stress" },
    ],
  },
  {
    label: "Learn",
    items: [
      { href: "/tracks", label: "Career Tracks", icon: "compass", keywords: "role path sde frontend backend" },
      { href: "/subjects", label: "Core Subjects", icon: "book", keywords: "os dbms cn oop theory flashcards" },
      { href: "/assessment", label: "Assessment", icon: "clipboard", keywords: "test quiz calibration placement" },
      { href: "/roadmap", label: "Roadmap", icon: "map", keywords: "plan sprint schedule" },
    ],
  },
  {
    label: "Interview",
    items: [
      { href: "/mocks", label: "AI Mocks", icon: "mic", keywords: "interview claude voice" },
      { href: "/peer-mocks", label: "Peer Mocks", icon: "users", keywords: "pair video" },
      { href: "/code-dna", label: "Code DNA", icon: "fingerprint", keywords: "fingerprint strengths strategist" },
      { href: "/oa", label: "OA Fingerprint", icon: "target", keywords: "online assessment patterns" },
      { href: "/companies", label: "Company Prep", icon: "building", keywords: "amazon google company specific interview problems coverage" },
    ],
  },
  {
    label: "Career",
    items: [
      { href: "/resume", label: "Resume", icon: "doc", keywords: "cv ats score" },
      { href: "/projects", label: "Projects", icon: "cube", keywords: "btech build portfolio" },
      { href: "/internships", label: "Internships", icon: "building", keywords: "intern ppo stipend" },
      { href: "/jobs", label: "Jobs", icon: "briefcase", keywords: "apply tracker hiring" },
      { href: "/mentors", label: "Mentors", icon: "search", keywords: "book session expert" },
    ],
  },
  {
    label: "More",
    items: [
      { href: "/forum", label: "Community", icon: "chat", keywords: "forum threads discuss" },
      { href: "/wrapped", label: "Wrapped", icon: "gift", keywords: "year review stats" },
      { href: "/certificates", label: "Certificates", icon: "award", keywords: "verify linkedin pdf" },
      { href: "/fun", label: "Roast + Offer", icon: "smile", keywords: "roast offer letter motivation" },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/billing", label: "Billing", icon: "card", keywords: "plan upgrade pricing payment" },
      { href: "/settings", label: "Settings", icon: "gear", keywords: "profile theme account" },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);
