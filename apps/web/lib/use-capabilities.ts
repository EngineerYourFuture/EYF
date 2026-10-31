"use client";
import { useApi } from "./use-api";

export type Capabilities = { ai: boolean; transcription: boolean };

/** Which AI providers the API can run (from /me). Undefined while loading. */
export function useCapabilities(): Capabilities | undefined {
  return useApi<{ capabilities?: Capabilities }>("/me").data?.capabilities;
}
