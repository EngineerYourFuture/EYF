/**
 * Real-company aptitude test blueprints — the Aptitude differentiator.
 *
 * Competitors give generic MCQ practice. EYF lets students rehearse the EXACT
 * test they'll sit: the real sections, question counts and per-section time
 * limits of TCS NQT, AMCAT, Infosys InfyTQ, CoCubes. Deterministic data; the
 * sim runner reuses the existing /mcq/start per section.
 */
import { McqCategory } from "@eyf/db";

export type SimSection = { name: string; category: McqCategory; questions: number; minutes: number };
export type CompanySim = {
  slug: string;
  company: string;
  label: string;
  blurb: string;
  usedBy: string;
  sections: SimSection[];
};

export const COMPANY_SIMS: CompanySim[] = [
  {
    slug: "tcs-nqt", company: "TCS", label: "TCS NQT",
    blurb: "The National Qualifier Test — TCS's mass-hiring gateway.",
    usedBy: "TCS",
    sections: [
      { name: "Numerical Ability", category: McqCategory.APTITUDE, questions: 20, minutes: 25 },
      { name: "Reasoning Ability", category: McqCategory.LOGICAL, questions: 20, minutes: 25 },
      { name: "Verbal Ability", category: McqCategory.VERBAL, questions: 25, minutes: 25 },
    ],
  },
  {
    slug: "amcat", company: "AMCAT", label: "AMCAT",
    blurb: "Aspiring Minds' employability test — used across service + product firms.",
    usedBy: "Cognizant, Accenture, Mphasis",
    sections: [
      { name: "Quantitative Ability", category: McqCategory.APTITUDE, questions: 16, minutes: 18 },
      { name: "Logical Ability", category: McqCategory.LOGICAL, questions: 14, minutes: 16 },
      { name: "English Comprehension", category: McqCategory.VERBAL, questions: 18, minutes: 18 },
    ],
  },
  {
    slug: "infosys-infytq", company: "Infosys", label: "Infosys InfyTQ",
    blurb: "Infosys's certification + hiring assessment.",
    usedBy: "Infosys",
    sections: [
      { name: "Quantitative Aptitude", category: McqCategory.APTITUDE, questions: 15, minutes: 25 },
      { name: "Logical Reasoning", category: McqCategory.LOGICAL, questions: 15, minutes: 25 },
      { name: "Verbal Ability", category: McqCategory.VERBAL, questions: 20, minutes: 20 },
    ],
  },
  {
    slug: "cocubes", company: "CoCubes", label: "CoCubes",
    blurb: "Campus assessment used across mass-recruiter drives.",
    usedBy: "Wipro, LTIMindtree",
    sections: [
      { name: "Quantitative", category: McqCategory.APTITUDE, questions: 20, minutes: 25 },
      { name: "Logical", category: McqCategory.LOGICAL, questions: 15, minutes: 20 },
      { name: "Verbal", category: McqCategory.VERBAL, questions: 20, minutes: 20 },
    ],
  },
];

export function simSummary(sim: CompanySim) {
  const totalQuestions = sim.sections.reduce((a, s) => a + s.questions, 0);
  const totalMinutes = sim.sections.reduce((a, s) => a + s.minutes, 0);
  return { totalQuestions, totalMinutes };
}
