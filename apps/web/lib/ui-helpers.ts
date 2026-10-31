/** Small shared UI helpers — extracted so tone/label selection is written once
 *  (and to keep call sites free of nested ternaries). */

export type Tone = "easy" | "medium" | "hard" | "accent";

/** Button label for a create/edit form. */
export function saveLabel(saving: boolean, editing: unknown, createLabel: string): string {
  if (saving) return "Saving…";
  if (editing) return "Save changes";
  return createLabel;
}

/** Map a difficulty enum (EASY/MEDIUM/HARD/EXPERT) to a badge tone. */
export function difficultyTone(d: string): "easy" | "medium" | "hard" {
  if (d === "EASY") return "easy";
  if (d === "HARD" || d === "EXPERT") return "hard";
  return "medium";
}

/** 0–100 score → tone at the 70/40 thresholds. */
export function scoreTone(n: number): "easy" | "medium" | "hard" {
  if (n >= 70) return "easy";
  if (n >= 40) return "medium";
  return "hard";
}

/** Overall readiness score → tone at the 80/50 thresholds. */
export function overallTone(n: number): "easy" | "accent" | "medium" {
  if (n >= 80) return "easy";
  if (n >= 50) return "accent";
  return "medium";
}

/** Progress-bar fill class at the given high threshold (default 70) / 40. */
export function masteryBarClass(n: number, hi = 70): string {
  if (n >= hi) return "bg-easy";
  if (n >= 40) return "bg-medium";
  return "bg-brand";
}

/** 4-band readiness bar fill class (85/65/40). */
export function readinessBarClass(n: number): string {
  if (n >= 85) return "bg-easy";
  if (n >= 65) return "bg-accent";
  if (n >= 40) return "bg-medium";
  return "bg-hard";
}

/** Tone → text color class. */
export function toneTextClass(tone: string): string {
  if (tone === "easy") return "text-easy";
  if (tone === "medium") return "text-medium";
  if (tone === "hard") return "text-hard";
  return "text-text-3";
}
