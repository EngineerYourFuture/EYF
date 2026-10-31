"use client";
import { useCapabilities } from "@/lib/use-capabilities";

/**
 * Says up front that an AI feature can't run on this server, instead of letting
 * the learner do the work and fail at submit. Renders nothing while loading or
 * when the provider is configured.
 */
export function AiUnavailable({ children, className = "" }: Readonly<{ children: string; className?: string }>) {
  if (useCapabilities()?.ai !== false) return null;
  return (
    <p role="status" className={`rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm text-text-2 ${className}`}>
      {children}
    </p>
  );
}
