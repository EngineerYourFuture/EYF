import { clearSession, getSession, setSession } from "./session";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

// Attempt to refresh the access token using the httpOnly refresh cookie.
// Returns the new access token on success, null on failure.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  // Deduplicate concurrent refresh calls — only one in-flight at a time.
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        clearSession();
        window.location.href = "/login";
        return null;
      }
      const data = (await res.json()) as { accessToken: string };
      const session = getSession();
      if (session) {
        setSession({ ...session, accessToken: data.accessToken });
      }
      return data.accessToken;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export const apiRequest = async <T>(
  path: string,
  options?: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    token?: string;
    body?: unknown;
    credentials?: RequestCredentials;
  }
): Promise<T> => {
  const doFetch = (token?: string) =>
    fetch(`${API_BASE}${path}`, {
      method: options?.method ?? "GET",
      credentials: options?.credentials ?? "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

  let response = await doFetch(options?.token);

  // On 401, attempt a silent token refresh and retry once.
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await doFetch(newToken);
    }
  }

  const rawText = await response.text();
  const json = rawText ? (JSON.parse(rawText) as unknown) : null;

  if (!response.ok) {
    const errorShape = json as { error?: { code?: string; message?: string } } | null;
    throw new ApiError(
      response.status,
      errorShape?.error?.code ?? "HTTP_ERROR",
      errorShape?.error?.message ?? `Request failed with status ${response.status}`
    );
  }
  return json as T;
};

export const apiGet = <T>(path: string, token?: string) =>
  apiRequest<T>(path, { token });

export const apiPost = <T>(path: string, body: unknown, token?: string) =>
  apiRequest<T>(path, { method: "POST", body, token });

export const apiPut = <T>(path: string, body: unknown, token?: string) =>
  apiRequest<T>(path, { method: "PUT", body, token });

export const apiPatch = <T>(path: string, body: unknown, token?: string) =>
  apiRequest<T>(path, { method: "PATCH", body, token });

export const apiDelete = <T>(path: string, token?: string) =>
  apiRequest<T>(path, { method: "DELETE", token });
