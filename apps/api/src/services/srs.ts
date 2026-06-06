/**
 * SuperMemo-2 spaced repetition.
 * Quality is the user's self-rated recall (0 = blackout, 5 = perfect).
 * Returns the next (easiness, interval, repetitions, dueAt).
 */
export type SrsState = { easiness: number; interval: number; repetitions: number };

export function nextReview(
  prev: SrsState,
  quality: 0 | 1 | 2 | 3 | 4 | 5,
): SrsState & { dueAt: Date } {
  let { easiness, interval, repetitions } = prev;

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    interval = repetitions === 1 ? 1 : repetitions === 2 ? 6 : Math.round(interval * easiness);
  }
  easiness = Math.max(
    1.3,
    easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
  );
  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + interval);
  return { easiness, interval, repetitions, dueAt };
}
