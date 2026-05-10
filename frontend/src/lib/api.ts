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

export const apiRequest = async <T>(
  path: string,
  options?: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    token?: string;
    body?: unknown;
    credentials?: RequestCredentials;
  }
): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options?.method ?? "GET",
    credentials: options?.credentials ?? "include",
    headers: {
      "Content-Type": "application/json",
      ...(options?.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

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
