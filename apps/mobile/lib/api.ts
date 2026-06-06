import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const BASE = (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? "https://api.eyf.in/v1";

export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number) { super(message); }
}

export async function apiFetch<T>(path: string, init: RequestInit & { token?: string | null } = {}): Promise<T> {
  const token = init.token ?? (await SecureStore.getItemAsync("eyf_token"));
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const json = await res.json();
  if (!json.success) throw new ApiError(json.error?.code ?? "ERR", json.error?.message ?? "Failed", res.status);
  return json.data;
}
