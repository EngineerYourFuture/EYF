export type SprintTopic = "api" | "sql" | "testing";
export type SprintStep = "start" | "baseline" | "drills" | "challenge" | "retest" | "report";
export type SprintQuestion = { id: string; topic: SprintTopic; prompt: string; choices: string[] };
export type SprintResult = { correct: number; total: number; topics: { key: SprintTopic; label: string; correct: number; total: number }[] };
export type SprintDrill = { topic: SprintTopic; title: string; lesson: string; question: SprintQuestion };
export type SprintNotes = { explanation: string; sql: string; tests: string; assistance: "none" | "ai" | "person" | "both" };
export type SprintCodeEvidence = { submissionId: string; submittedAt: string; language: string; passedTests: number; totalTests: number; suiteHash: string; codeHash: string; taskVersion: number };
export type SprintReport = {
  version: number; name: string; startedAt: string; completedAt: string;
  baseline: SprintResult; retest: SprintResult;
  challenge: { title: string; slug: string; evidence: SprintCodeEvidence; notes: SprintNotes };
  assessmentMethod: string; reviewMethod: string;
};
export type SprintState = {
  step: SprintStep; startedAt: string | null; questions: SprintQuestion[]; drills: SprintDrill[];
  baseline: SprintResult | null; retest: SprintResult | null; notes: SprintNotes | null;
  challenge: { slug: string; title: string; version: number; testCount: number };
  submission: { id: string; verdict: string; passedTests: number; totalTests: number; submittedAt: string; eligible: boolean } | null;
  report: SprintReport | null; share: { token: string; expiresAt: string } | null;
};

export type SprintReviewFeedback = { id: string; organization: string; requestedAt: string; revokedAt: string | null; reviewedAt: string | null; reviewerName: string | null; rubric: Record<"authorization" | "dataAccess" | "testing" | "explanation", number> | null; feedback: string | null };
export type SprintPracticeState = {
  history: { id: string; sequence: number; bankVersion: number; startedAt: string; completedAt: string | null; result: SprintResult | null }[];
  active: { id: string; sequence: number; repeated: boolean; questions: SprintQuestion[] } | null;
  feedback: { prompt: string; answer: string; explanation: string }[];
};
