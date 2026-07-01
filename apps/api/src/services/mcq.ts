/**
 * MCQ scoring. Grades a submitted set of answers against the editorial bank
 * (src/lib/mcq-bank.ts). Skipped answers (choice = -1) count as wrong, matching
 * real placement tests. Returns a 0–100 score plus a per-question review payload
 * so the client can render right/wrong with explanations.
 */
import { getMcq, type McqQuestion } from "../lib/mcq-bank.js";

export type McqAnswer = { questionId: string; choice: number };

export type McqReviewItem = {
  questionId: string;
  prompt: string;
  choices: string[];
  chosen: number;
  correctIndex: number;
  isCorrect: boolean;
  explanation: string;
  topic: string;
};

export type McqResult = {
  totalQuestions: number;
  correctAnswers: number;
  score: number; // 0–100
  byTopic: Record<string, { right: number; total: number }>;
  review: McqReviewItem[];
};

export function scoreMcq(answers: McqAnswer[]): McqResult {
  const byTopic: Record<string, { right: number; total: number }> = {};
  const review: McqReviewItem[] = [];
  let correct = 0;

  for (const a of answers) {
    const q: McqQuestion | undefined = getMcq(a.questionId);
    if (!q) continue; // ignore unknown ids rather than trusting client
    const isCorrect = a.choice === q.correctIndex;
    if (isCorrect) correct += 1;

    const bucket = (byTopic[q.topic] ??= { right: 0, total: 0 });
    bucket.total += 1;
    if (isCorrect) bucket.right += 1;

    review.push({
      questionId: q.id,
      prompt: q.prompt,
      choices: q.choices,
      chosen: a.choice,
      correctIndex: q.correctIndex,
      isCorrect,
      explanation: q.explanation,
      topic: q.topic,
    });
  }

  const total = review.length;
  return {
    totalQuestions: total,
    correctAnswers: correct,
    score: total ? Math.round((correct / total) * 100) : 0,
    byTopic,
    review,
  };
}
