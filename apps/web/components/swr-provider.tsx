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
import { toast } from "sonner";
import { ApiClientError } from "@/lib/api";

export function SwrProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <SWRConfig
      value={{
        keepPreviousData: true,
        dedupingInterval: 15_000,
        revalidateOnFocus: false,
        errorRetryCount: 3,
        // U1 (docs/KNOWN-ISSUES.md): give EVERY read a global error surface so a degraded
        // API shows a message instead of an infinite skeleton. Terminal 4xx states (404
        // "no data yet", 402 upgrade, 403 forbidden, 400) are handled inline by pages, so
        // only transient failures (5xx / network) toast. Deduped per key so the 3 retries
        // don't stack toasts.
        onError: (err, key) => {
          if (err instanceof ApiClientError && [400, 402, 403, 404].includes(err.status)) return;
          toast.error("Trouble loading data — retrying. Check your connection.", { id: `swr:${key}` });
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
