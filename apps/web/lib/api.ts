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
  // Only declare a JSON content-type when we're actually sending a JSON body.
  // Fastify rejects an empty body when content-type is application/json — which
  // would 400 every body-less POST (mock end, booking, roast, etc.).
  const hasBody = rest.body != null;
  // Admin access-gate token (set after passing the /admin gate). Harmless on
  // non-admin routes; the API only checks it on capability-gated admin routes.
  const gate = typeof window !== "undefined" ? window.sessionStorage.getItem("eyf-admin-gate") : null;
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: {
      ...(hasBody ? { "content-type": "application/json" } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(gate ? { "x-admin-gate": gate } : {}),
      ...headers,
    },
    cache: "no-store",
  });
  // The API always answers with a JSON ApiResponse envelope — but a gateway/proxy
  // error (502/504), a timeout, or an empty body is NOT that shape, and res.json()
  // would throw a cryptic SyntaxError ("Unexpected token <") instead of a usable
  // error. Normalize any non-envelope response into a clean ApiClientError.
  let json: ApiResponse<T>;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiClientError(
      "UNEXPECTED_RESPONSE",
      res.ok ? "The server returned an unreadable response." : `Request failed (${res.status}). Please try again.`,
      res.status,
    );
  }
  if (!json.success) {
    throw new ApiClientError(json.error.code, json.error.message, res.status);
  }
  return json.data;
}
