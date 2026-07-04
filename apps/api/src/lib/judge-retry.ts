/**
 * A BullMQ job's `failed` event fires on every attempt. A submission should only
 * be marked terminally errored once retries are exhausted — otherwise a transient
 * Judge0 blip would wrongly fail a submission that a retry would have judged.
 */
export function isFinalFailure(attemptsMade: number, maxAttempts: number | undefined): boolean {
  return attemptsMade >= (maxAttempts ?? 1);
}
