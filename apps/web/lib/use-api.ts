"use client";
import useSWR, { type SWRConfiguration } from "swr";
import { toast } from "sonner";
import { useEyfAuth as useAuth } from "@/lib/auth";
import { fetchApi, ApiClientError } from "./api";

export function useApi<T>(path: string | null, options?: SWRConfiguration<T>) {
  const { getToken } = useAuth();
  return useSWR<T>(
    path,
    async (key: string) => {
      const token = await getToken();
      return fetchApi<T>(key, { token });
    },
    {
      // 400/402/403/404 are terminal — the response won't change on retry, so
      // retrying wastes 5 round-trips and pins components on their loading state
      // (e.g. the "no editorial yet" 404 that used to hang forever). But KEEP
      // retrying 401: auth can become available after a token refresh, so a 401
      // is transient. 5xx / network errors also stay retryable. Callers override
      // via `options`.
      shouldRetryOnError: (err: unknown) =>
        !(err instanceof ApiClientError && [400, 402, 403, 404].includes(err.status)),
      ...options,
    },
  );
}

/** Human-friendly message for a failed mutation. */
function actionMessage(e: unknown): string {
  if (e instanceof ApiClientError) {
    if (e.code === "AI_UNAVAILABLE") return e.message || "This AI feature isn't configured yet.";
    if (e.status === 402 || e.code === "PLAN_REQUIRED") return e.message || "Upgrade your plan to use this.";
    if (e.status === 401 || e.status === 403) return "You're not allowed to do that.";
    if (e.status >= 500) return "Something went wrong on our end. Try again.";
    return e.message || "That didn't work.";
  }
  if (e instanceof TypeError) return "Network error — check your connection.";
  return (e as Error)?.message || "Something went wrong.";
}

type ActionOpts = { silent?: boolean };

export function useApiAction() {
  const { getToken } = useAuth();
  return async <T>(
    path: string,
    init: RequestInit = {},
    opts: ActionOpts = {},
  ): Promise<T> => {
    const token = await getToken();
    try {
      return await fetchApi<T>(path, { ...init, token });
    } catch (e) {
      if (!opts.silent) toast.error(actionMessage(e));
      throw e;
    }
  };
}
