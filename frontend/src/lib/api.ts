const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

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
    method?: "GET" | "POST" | "PUT" | "DELETE";
    token?: string;
    body?: unknown;
  }
): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options?.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options?.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options?.body ? JSON.stringify(options.body) : undefined
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
