"use client";
import { LoadError as RecordLoadError } from "@/components/load-error";
export const fieldClass = "w-full min-w-0 rounded-md border border-border bg-surface px-3 py-2.5 text-base text-text-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";
/** Worded by status (missing, forbidden, network) so a refused page never offers a pointless retry. Most callers are one panel of a loaded page; whole-page loads pass what="page". */
export function LoadError({ error, retry, what = "section", page }: { error: unknown; retry: () => unknown; what?: string; page?: boolean }) {
  return error ? <RecordLoadError error={error} what={what} page={page} retry={() => { void retry(); }} /> : null;
}
