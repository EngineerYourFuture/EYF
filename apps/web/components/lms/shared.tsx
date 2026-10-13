"use client";
import { ErrorState } from "@eyf/ui";
export const fieldClass = "w-full min-w-0 rounded-md border border-border bg-surface px-3 py-2.5 text-base text-text-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";
export function LoadError({ error, retry }: { error: unknown; retry: () => unknown }) {
  return error ? <ErrorState message="We couldn't load this information. Try again." retry={() => { void retry(); }} /> : null;
}
