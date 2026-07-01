/**
 * Communication drill prompts — spoken-English / HR / behavioural practice.
 *
 * Editorial content (mirrors mcq-bank.ts / assessment-bank.ts). Each prompt
 * carries a coaching `tip` and the `covers` checklist a strong answer should
 * hit — both are fed to Claude so feedback is grounded in a rubric rather than
 * vibes. Attempts persist in CommunicationDrill.
 */

export type CommunicationKind = "INTRO" | "HR" | "BEHAVIORAL" | "SITUATIONAL";

export type CommunicationPrompt = {
  id: string;
  kind: CommunicationKind;
  question: string;
  tip: string;
  /** What a strong answer must cover — used to anchor the AI rubric. */
  covers: string[];
};

export const COMMUNICATION_KINDS: { id: CommunicationKind; name: string; blurb: string }[] = [
  { id: "INTRO",       name: "Introduction",  blurb: "The opener every interview starts with — nail the first 90 seconds." },
  { id: "HR",          name: "HR & Motivation", blurb: "Why us, strengths & weaknesses, career goals." },
  { id: "BEHAVIORAL",  name: "Behavioural (STAR)", blurb: "\"Tell me about a time…\" — structure with Situation-Task-Action-Result." },
  { id: "SITUATIONAL", name: "Situational",   blurb: "Hypothetical judgement, conflict, and prioritisation." },
];

export const COMMUNICATION_BANK: CommunicationPrompt[] = [
  // ── Introduction ──
  { id: "intro-1", kind: "INTRO",
    question: "Tell me about yourself.",
    tip: "Present → past → future. 60–90 seconds. Lead with your current focus, not your birthplace.",
    covers: ["current role/year & focus", "1–2 relevant strengths or projects", "why you're a fit for this role", "concise, no rambling"] },
  { id: "intro-2", kind: "INTRO",
    question: "Walk me through your resume.",
    tip: "Tell a story with a through-line, don't read bullet points. Connect each step to the next.",
    covers: ["clear chronology", "reasoning behind key choices", "quantified impact", "ties to the target role"] },
  { id: "intro-3", kind: "INTRO",
    question: "What is your favourite project and why?",
    tip: "Pick one project. Explain the problem, your specific contribution, and the outcome.",
    covers: ["the problem it solved", "your specific role", "a technical challenge overcome", "measurable result or learning"] },

  // ── HR & Motivation ──
  { id: "hr-1", kind: "HR",
    question: "Why do you want to work at our company?",
    tip: "Show you researched them. Connect their work/values to your own goals — avoid generic praise.",
    covers: ["specific, researched reason", "alignment with your goals", "what you'd contribute", "genuine, not flattery"] },
  { id: "hr-2", kind: "HR",
    question: "What is your greatest strength?",
    tip: "Pick one strength relevant to the role and back it with a concrete example.",
    covers: ["a role-relevant strength", "a specific supporting example", "the impact it had", "self-awareness"] },
  { id: "hr-3", kind: "HR",
    question: "What is your greatest weakness?",
    tip: "Choose a real weakness and, crucially, the steps you're taking to improve it. Never fake-humble.",
    covers: ["a genuine weakness", "concrete steps to improve", "evidence of progress", "not a disguised strength"] },
  { id: "hr-4", kind: "HR",
    question: "Where do you see yourself in five years?",
    tip: "Show ambition that's realistic and aligned with a path the company can offer.",
    covers: ["clear direction", "growth mindset", "alignment with the role/company", "realistic"] },
  { id: "hr-5", kind: "HR",
    question: "Why should we hire you?",
    tip: "Match your top 2–3 strengths directly to what the role needs. Be confident, not arrogant.",
    covers: ["role-specific value", "differentiator vs other candidates", "evidence", "confident tone"] },

  // ── Behavioural (STAR) ──
  { id: "beh-1", kind: "BEHAVIORAL",
    question: "Tell me about a time you faced a conflict in a team and how you resolved it.",
    tip: "Use STAR: Situation, Task, Action, Result. Focus on YOUR actions and the outcome.",
    covers: ["clear situation & your task", "specific actions you took", "how it was resolved", "a concrete result/learning"] },
  { id: "beh-2", kind: "BEHAVIORAL",
    question: "Describe a time you failed. What did you learn?",
    tip: "Own the failure honestly, then emphasise the lesson and how you applied it later.",
    covers: ["honest ownership", "what went wrong", "the lesson learned", "how you applied it since"] },
  { id: "beh-3", kind: "BEHAVIORAL",
    question: "Give an example of a time you led a team or took initiative.",
    tip: "Leadership isn't a title. Show how you moved something forward and influenced others.",
    covers: ["the initiative you took", "how you influenced others", "obstacles handled", "the outcome"] },
  { id: "beh-4", kind: "BEHAVIORAL",
    question: "Tell me about a time you had to meet a tight deadline.",
    tip: "Show prioritisation and calm under pressure — the process matters as much as the result.",
    covers: ["the pressure/constraint", "how you prioritised", "actions under pressure", "the result"] },

  // ── Situational ──
  { id: "sit-1", kind: "SITUATIONAL",
    question: "You disagree with your manager's technical decision. What do you do?",
    tip: "Show respect for hierarchy while demonstrating you can advocate with data, then commit.",
    covers: ["seek to understand first", "advocate with evidence/data", "disagree-and-commit maturity", "professional tone"] },
  { id: "sit-2", kind: "SITUATIONAL",
    question: "You're assigned two urgent tasks with the same deadline. How do you handle it?",
    tip: "Talk through prioritisation criteria and communication with stakeholders.",
    covers: ["prioritisation criteria", "stakeholder communication", "a concrete plan", "trade-off awareness"] },
  { id: "sit-3", kind: "SITUATIONAL",
    question: "A teammate isn't pulling their weight on a group project. What would you do?",
    tip: "Empathy first, escalation last. Show you'd address it directly and constructively.",
    covers: ["direct but empathetic approach", "understanding root cause", "constructive resolution", "when/how you'd escalate"] },
];

const BY_ID = new Map(COMMUNICATION_BANK.map((p) => [p.id, p]));
export const getPrompt = (id: string): CommunicationPrompt | undefined => BY_ID.get(id);

export function promptsByKind(kind?: CommunicationKind): CommunicationPrompt[] {
  return kind ? COMMUNICATION_BANK.filter((p) => p.kind === kind) : COMMUNICATION_BANK;
}
