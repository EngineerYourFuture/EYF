"use client";
import useSWR, { type SWRConfiguration } from "swr";
import { useEyfAuth as useAuth } from "@/lib/auth";
import { fetchApi } from "./api";

export function useApi<T>(path: string | null, options?: SWRConfiguration<T>) {
  const { getToken } = useAuth();
  return useSWR<T>(
    path,
    async (key: string) => {
      const token = await getToken();
      return fetchApi<T>(key, { token });
    },
    options,
  );
}

export function useApiAction() {
  const { getToken } = useAuth();
  return async <T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> => {
    const token = await getToken();
    return fetchApi<T>(path, { ...init, token });
  };
}
