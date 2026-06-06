/**
 * Typed fetch wrapper for the EYF API.
 *
 * In client components we get the token from Clerk via useAuth().getToken();
 * in server components we pass it in. Both routes go through fetchApi().
 */
import type { ApiResponse } from "@eyf/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1";

export class ApiClientError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function fetchApi<T = unknown>(
  path: string,
  init: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...rest } = init;
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    cache: "no-store",
  });
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) {
    throw new ApiClientError(json.error.code, json.error.message, res.status);
  }
  return json.data;
}
