import type { IconName } from "@/components/icons";

export type NavItem = { href: string; label: string; icon: IconName; keywords?: string };
export type NavGroup = { label: string; items: NavItem[] };

/** Shared route metadata; journeys and navigation reuse the same labels and icons. */
export const DESTINATIONS = {
  today: { href: "/today", label: "Today", icon: "Bolt", keywords: "daily plan agenda focus" },
  sprint: { href: "/sprint", label: "Placement Sprint", icon: "Target", keywords: "backend diagnostic practical evidence report proof" },
  dashboard: { href: "/dashboard", label: "Dashboard", icon: "Home", keywords: "home overview" },
  readiness: { href: "/readiness", label: "Readiness", icon: "Target", keywords: "placement ready score am i ready gaps progress" },
  skills: { href: "/skills", label: "Skill Graph", icon: "Activity", keywords: "mastery strengths weakness radar dsa aptitude subjects map" },
  labs: { href: "/labs", label: "Practical Labs", icon: "Code", keywords: "sql database backend real world exercises" },
  problems: { href: "/problems", label: "Problems", icon: "Code", keywords: "dsa coding leetcode solve" },
  visualizer: { href: "/visualizer", label: "Visualizer", icon: "Activity", keywords: "algorithm animation sort bst graph" },
  games: { href: "/games", label: "Cognitive Games", icon: "Brain", keywords: "reaction n-back stroop aptitude" },
  pressure: { href: "/pressure", label: "Pressure Mode", icon: "Gauge", keywords: "timed anxiety stress" },
  tracks: { href: "/tracks", label: "Career Tracks", icon: "Compass", keywords: "role path sde frontend backend" },
  subjects: { href: "/subjects", label: "Core Subjects", icon: "Book", keywords: "os dbms cn oop theory flashcards" },
  ask: { href: "/ask", label: "Ask EYF", icon: "Sparkle", keywords: "question answer doubt tech stack explain why how intelligence kb knowledge" },
  assessment: { href: "/assessment", label: "Assessment", icon: "Clipboard", keywords: "test quiz calibration placement" },
  mcq: { href: "/mcq", label: "MCQ Tests", icon: "Clipboard", keywords: "aptitude verbal reasoning logical quant timed test company tcs infosys wipro amazon multiple choice quiz mcq core cs" },
  roadmap: { href: "/roadmap", label: "Roadmap", icon: "Map", keywords: "plan sprint schedule" },
  mocks: { href: "/mocks", label: "AI Mocks", icon: "Mic", keywords: "interview claude voice" },
  communication: { href: "/communication", label: "Communication", icon: "Chat", keywords: "hr behavioral star spoken english verbal tell me about yourself soft skills fluency confidence" },
  peerMocks: { href: "/peer-mocks", label: "Peer Mocks", icon: "Users", keywords: "pair video" },
  codeDna: { href: "/code-dna", label: "Code DNA", icon: "Fingerprint", keywords: "fingerprint strengths strategist" },
  oa: { href: "/oa", label: "OA Fingerprint", icon: "Target", keywords: "online assessment patterns" },
  experiences: { href: "/experiences", label: "Interview Experiences", icon: "Chat", keywords: "interview experience writeup rounds offer rejected company debrief" },
  companies: { href: "/companies", label: "Company Prep", icon: "Building", keywords: "amazon google company specific interview problems coverage" },
  resume: { href: "/resume", label: "Resume", icon: "Doc", keywords: "cv ats score" },
  projects: { href: "/projects", label: "Projects", icon: "Cube", keywords: "btech build portfolio" },
  projectPrep: { href: "/project-prep", label: "Project Prep", icon: "Cube", keywords: "defend project interview questions resume grilling explain viva tech stack" },
  internships: { href: "/internships", label: "Internships", icon: "Building", keywords: "intern ppo stipend" },
  jobs: { href: "/jobs", label: "Jobs", icon: "Briefcase", keywords: "apply tracker hiring" },
  pipeline: { href: "/pipeline", label: "Pipeline", icon: "Activity", keywords: "applications kanban tracker status offer deadline funnel" },
  offer: { href: "/offer", label: "Salary Scenarios", icon: "Card", keywords: "salary package ctc lpa offer compensation scenarios" },
  mentors: { href: "/mentors", label: "Mentors", icon: "Search", keywords: "book session expert" },
  forum: { href: "/forum", label: "Community", icon: "Chat", keywords: "forum threads discuss" },
  leaderboard: { href: "/leaderboard", label: "Leaderboard", icon: "Trophy", keywords: "rank cohort college class compete top percentile" },
  wrapped: { href: "/wrapped", label: "Wrapped", icon: "Gift", keywords: "year review stats" },
  certificates: { href: "/certificates", label: "Certificates", icon: "Award", keywords: "verify linkedin pdf" },
  fun: { href: "/fun", label: "Roast + Offer", icon: "Smile", keywords: "roast offer letter motivation" },
  billing: { href: "/billing", label: "Billing", icon: "Card", keywords: "plan upgrade pricing payment" },
  settings: { href: "/settings", label: "Settings", icon: "Gear", keywords: "profile theme account" },
} satisfies Record<string, NavItem>;

/** Single source of truth for app navigation — used by the sidebar and the ⌘K palette. */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Practice",
    items: [
      DESTINATIONS.today,
      DESTINATIONS.sprint,
      DESTINATIONS.dashboard,
      DESTINATIONS.readiness,
      DESTINATIONS.skills,
      DESTINATIONS.labs,
      DESTINATIONS.problems,
      DESTINATIONS.visualizer,
      DESTINATIONS.games,
      DESTINATIONS.pressure,
    ],
  },
  {
    label: "Learn",
    items: [
      DESTINATIONS.tracks,
      DESTINATIONS.subjects,
      DESTINATIONS.ask,
      DESTINATIONS.assessment,
      DESTINATIONS.mcq,
      DESTINATIONS.roadmap,
    ],
  },
  {
    label: "Interview",
    items: [
      DESTINATIONS.mocks,
      DESTINATIONS.communication,
      DESTINATIONS.peerMocks,
      DESTINATIONS.codeDna,
      DESTINATIONS.oa,
      DESTINATIONS.experiences,
      DESTINATIONS.companies,
    ],
  },
  {
    label: "Career",
    items: [
      DESTINATIONS.resume,
      DESTINATIONS.projects,
      DESTINATIONS.projectPrep,
      DESTINATIONS.internships,
      DESTINATIONS.jobs,
      DESTINATIONS.pipeline,
      DESTINATIONS.offer,
      DESTINATIONS.mentors,
    ],
  },
  {
    label: "More",
    items: [
      DESTINATIONS.forum,
      DESTINATIONS.leaderboard,
      DESTINATIONS.wrapped,
      DESTINATIONS.certificates,
      DESTINATIONS.fun,
    ],
  },
  {
    label: "Account",
    items: [
      DESTINATIONS.billing,
      DESTINATIONS.settings,
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);
