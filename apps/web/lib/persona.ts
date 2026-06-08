import type { IconName } from "@/components/icons";

export type PersonaId = "STUDENT" | "SWITCHER" | "DEVELOPER";

export type JourneyItem = { label: string; href: string; icon: IconName; why: string };
export type PersonaDef = {
  id: PersonaId;
  label: string;
  who: string;        // who it's for
  tagline: string;    // dashboard hero line
  icon: IconName;
  blurb: string;      // picker description
  journey: JourneyItem[]; // the curated path that matters for this persona
};

/**
 * Spec PROBLEM #9 — different user types need different journeys. A persona
 * curates EXISTING modules into the path that matters, and tailors the home
 * screen. It's orthogonal to a target role (which drives the roadmap).
 */
export const PERSONAS: Record<PersonaId, PersonaDef> = {
  STUDENT: {
    id: "STUDENT",
    label: "Student",
    who: "In college · 0–2 years · chasing your first placement",
    tagline: "Get placement-ready — one path from fundamentals to your first offer.",
    icon: "compass",
    blurb: "Placements, DSA, and core subjects. The fastest route from college to your first offer.",
    journey: [
      { label: "Placement Readiness", href: "/readiness", icon: "target", why: "Know exactly how ready you are" },
      { label: "Problems", href: "/problems", icon: "code", why: "Pattern-based DSA, not random grinding" },
      { label: "Core Subjects", href: "/subjects", icon: "book", why: "OS · DBMS · CN · OOP, interview-ready" },
      { label: "Assessment", href: "/assessment", icon: "clipboard", why: "Find your gaps in 20 questions" },
      { label: "Roadmap", href: "/roadmap", icon: "map", why: "Your week-by-week plan" },
    ],
  },
  SWITCHER: {
    id: "SWITCHER",
    label: "Job Switcher",
    who: "Working · 1–5 years · moving to a better company & package",
    tagline: "Level up the round that decides senior offers — design, behavioral, and comp.",
    icon: "briefcase",
    blurb: "System design, behavioral rounds, a senior-grade resume, and compensation intel.",
    journey: [
      { label: "AI Mocks", href: "/mocks", icon: "mic", why: "System-design & behavioral rounds" },
      { label: "Resume", href: "/resume", icon: "doc", why: "ATS-tuned for senior roles" },
      { label: "Jobs", href: "/jobs", icon: "briefcase", why: "Openings with real comp bands" },
      { label: "Pipeline", href: "/pipeline", icon: "activity", why: "Track every application to offer" },
      { label: "Mentors", href: "/mentors", icon: "users", why: "Guidance from people who switched" },
    ],
  },
  DEVELOPER: {
    id: "DEVELOPER",
    label: "Developer",
    who: "Building skills · moving from tutorials to real engineering",
    tagline: "Go from tutorials to real engineering — architecture, projects, and depth.",
    icon: "cube",
    blurb: "Architecture-first projects, advanced tracks, and proof of depth.",
    journey: [
      { label: "Projects", href: "/projects", icon: "cube", why: "Architecture-first, resume-worthy builds" },
      { label: "Career Tracks", href: "/tracks", icon: "compass", why: "Advanced, role-specific curricula" },
      { label: "Code DNA", href: "/code-dna", icon: "fingerprint", why: "Your engineering fingerprint & strengths" },
      { label: "Community", href: "/forum", icon: "chat", why: "Build & learn in public" },
      { label: "Certificates", href: "/certificates", icon: "award", why: "Prove your depth, verifiably" },
    ],
  },
};

export const PERSONA_LIST = Object.values(PERSONAS);
