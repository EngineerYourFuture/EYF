import { AsyncLocalStorage } from "node:async_hooks";
import type Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@eyf/db";
import { z } from "zod";
import { env } from "../env.js";

type UsageContext = { userId?: string; feature: string };
export const providerContext = new AsyncLocalStorage<() => UsageContext>();
const rate = z.number().finite().nonnegative();
const ratesSchema = z.record(z.object({ inputPerMillion: rate.optional(), outputPerMillion: rate.optional(), cacheReadPerMillion: rate.optional(), cacheWritePerMillion: rate.optional(), perMinute: rate.optional() }).strict());
export function parseProviderRates(raw?: string) { return ratesSchema.parse(JSON.parse(raw || "{}")); }
// Operators supply contracted rates, instead of baking rapidly changing prices into code.
const configuredRates = parseProviderRates(env.PROVIDER_RATES_JSON);
type Units = { inputTokens?: number; outputTokens?: number; cacheReadTokens?: number; cacheWriteTokens?: number; durationSeconds?: number };
export function estimateProviderCost(provider: string, model: string, units: Units, rates = configuredRates): number | null {
  const r = rates[`${provider}:${model}`];
  if (!r) return null;
  const terms: [number | undefined, number | undefined, number][] = [[units.inputTokens, r.inputPerMillion, 1_000_000], [units.outputTokens, r.outputPerMillion, 1_000_000], [units.cacheReadTokens, r.cacheReadPerMillion, 1_000_000], [units.cacheWriteTokens, r.cacheWritePerMillion, 1_000_000], [units.durationSeconds, r.perMinute, 60]];
  if (terms.some(([count, price]) => count && price === undefined)) return null;
  return terms.reduce((sum, [count, price, divisor]) => sum + (count ?? 0) * (price ?? 0) / divisor, 0);
}
type Usage = Units & { provider: string; model: string; outcome: "OK" | "ERROR"; latencyMs: number; requestId?: string };
export async function recordProviderUsage(usage: Usage) {
  const context = providerContext.getStore()?.();
  try { await prisma.providerUsage.create({ data: { ...usage, userId: context?.userId, feature: context?.feature ?? "background", estimatedUsd: usage.outcome === "OK" ? estimateProviderCost(usage.provider, usage.model, usage) : null } }); }
  catch (error) { if ((error as { code?: string }).code !== "P2002") console.warn("Provider usage could not be recorded; inspect database health."); }
}
export async function trackedMessage(client: Anthropic, params: Anthropic.MessageCreateParamsNonStreaming) {
  const started = Date.now();
  let response;
  try { response = await client.messages.create(params); }
  catch (error) { await recordProviderUsage({ provider: "anthropic", model: params.model, outcome: "ERROR", latencyMs: Date.now() - started }); throw error; }
  const usage = response.usage as typeof response.usage & { cache_read_input_tokens?: number; cache_creation_input_tokens?: number };
  if (usage) await recordProviderUsage({ provider: "anthropic", model: response.model, requestId: response.id, outcome: "OK", latencyMs: Date.now() - started, inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens, cacheReadTokens: usage.cache_read_input_tokens ?? 0, cacheWriteTokens: usage.cache_creation_input_tokens ?? 0 });
  return response;
}
