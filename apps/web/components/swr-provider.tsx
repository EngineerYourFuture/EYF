"use client";
/**
 * Global data-layer tuning — the "instant app" feel.
 *
 * - Account changes remount the cache. Never keep a previous account or
 *   organization response visible while a different key loads.
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
import { HAS_REAL_CLERK, useEyfAuth } from "@/lib/auth";
import { useMemo } from "react";

export function SwrProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  // Public pages in local preview must not start a dev login just to mount a cache.
  return HAS_REAL_CLERK ? <AuthenticatedCache>{children}</AuthenticatedCache> : <AccountCache>{children}</AccountCache>;
}

function AuthenticatedCache({ children }: Readonly<{ children: React.ReactNode }>) {
  const { userId } = useEyfAuth();
  return <AccountCache key={userId ?? "anonymous"}>{children}</AccountCache>;
}

function AccountCache({ children }: Readonly<{ children: React.ReactNode }>) {
  const cache = useMemo(() => new Map(), []);
  return (
    <SWRConfig
      value={{
        provider: () => cache,
        keepPreviousData: false,
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
