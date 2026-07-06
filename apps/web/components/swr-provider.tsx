"use client";
/**
 * Global data-layer tuning — the "instant app" feel.
 *
 * - keepPreviousData: navigating between filters/keys shows the last data
 *   instantly instead of flashing skeletons.
 * - dedupingInterval 15s: five components asking for /me within a screen
 *   share one request; tab-hopping doesn't re-storm the API.
 * - revalidateOnFocus off: alt-tabbing back doesn't jank the whole UI with
 *   refetch waterfalls; data still revalidates on mount and on mutate().
 *
 * Deliberately NO localStorage persistence: cached responses are per-user
 * (scores, resumes, payments) and EYF's content-protection posture treats
 * shared machines as hostile. In-memory cache already survives client-side
 * navigation, which is where the perceived speed lives.
 */
import { SWRConfig } from "swr";

export function SwrProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        keepPreviousData: true,
        dedupingInterval: 15_000,
        revalidateOnFocus: false,
        errorRetryCount: 3,
      }}
    >
      {children}
    </SWRConfig>
  );
}
