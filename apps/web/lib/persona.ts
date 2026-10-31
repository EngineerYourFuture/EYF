import { DESTINATIONS } from "./nav";
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
    icon: "Compass",
    blurb: "Placements, DSA, and core subjects. The fastest route from college to your first offer.",
    journey: [
      journey(DESTINATIONS.readiness, "Know exactly how ready you are", { label: "Placement Readiness" }),
      journey(DESTINATIONS.problems, "Pattern-based DSA, not random grinding"),
      journey(DESTINATIONS.subjects, "OS · DBMS · CN · OOP, interview-ready"),
      journey(DESTINATIONS.assessment, "Find your gaps in 20 questions"),
      journey(DESTINATIONS.roadmap, "Your week-by-week plan"),
    ],
  },
  SWITCHER: {
    id: "SWITCHER",
    label: "Job Switcher",
    who: "Working · 1–5 years · moving to a better company & package",
    tagline: "Level up the round that decides senior offers — design, behavioral, and comp.",
    icon: "Briefcase",
    blurb: "System design, behavioral rounds, a senior-grade resume, and compensation intel.",
    journey: [
      journey(DESTINATIONS.mocks, "System-design & behavioral rounds"),
      journey(DESTINATIONS.resume, "ATS-tuned for senior roles"),
      journey(DESTINATIONS.jobs, "Openings with real comp bands"),
      journey(DESTINATIONS.pipeline, "Track every application to offer"),
      journey(DESTINATIONS.mentors, "Guidance from people who switched", { icon: "Users" }),
    ],
  },
  DEVELOPER: {
    id: "DEVELOPER",
    label: "Developer",
    who: "Building skills · moving from tutorials to real engineering",
    tagline: "Go from tutorials to real engineering — architecture, projects, and depth.",
    icon: "Cube",
    blurb: "Architecture-first projects, advanced tracks, and proof of depth.",
    journey: [
      journey(DESTINATIONS.projects, "Architecture-first, resume-worthy builds"),
      journey(DESTINATIONS.tracks, "Advanced, role-specific curricula"),
      journey(DESTINATIONS.codeDna, "Your engineering fingerprint & strengths"),
      journey(DESTINATIONS.forum, "Build & learn in public"),
      journey(DESTINATIONS.certificates, "Prove your depth, verifiably"),
    ],
  },
};

export const PERSONA_LIST = Object.values(PERSONAS);

function journey(destination: { label: string; href: string; icon: IconName }, why: string, overrides?: Partial<Pick<JourneyItem, "label" | "icon">>): JourneyItem {
  return { label: destination.label, href: destination.href, icon: destination.icon, why, ...overrides };
}
