"use client";
import { useApi } from "./use-api";
import type { Readiness, GuidanceAction } from "./readiness";

/** Server-computed guidance: readiness + ranked next-best-actions + coach note. */
export type Guidance = {
  readiness: Readiness;
  actions: GuidanceAction[];
  coachNote: string;
  generatedAt: string;
  partial: boolean;
};

/** Fetches the active guidance engine (`GET /v1/guidance/me`). One call — the
 * server does the cross-pillar fusion, ranking, and coach note. */
export function useGuidance(): { guidance: Guidance | null; loading: boolean } {
  const { data } = useApi<Guidance>("/guidance/me");
  return { guidance: data ?? null, loading: !data };
}
