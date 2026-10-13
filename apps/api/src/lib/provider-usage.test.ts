import { describe, it, expect, vi } from "vitest";
const create = vi.hoisted(() => vi.fn().mockResolvedValue({}));
vi.mock("@eyf/db", () => ({ prisma: { providerUsage: { create } } }));
import { estimateProviderCost, parseProviderRates, providerContext, recordProviderUsage } from "./provider-usage.js";
describe("provider cost accounting", () => {
  const rates = parseProviderRates('{"anthropic:test":{"inputPerMillion":2,"outputPerMillion":8,"cacheReadPerMillion":0.2,"cacheWritePerMillion":2.5},"openai:whisper-1":{"perMinute":0.01}}');
  it("keeps missing prices unknown and prices all token types", () => {
    expect(estimateProviderCost("anthropic", "missing", { inputTokens: 1 }, rates)).toBeNull();
    expect(estimateProviderCost("anthropic", "test", { inputTokens: 1000, outputTokens: 1000, cacheReadTokens: 1000, cacheWriteTokens: 1000 }, rates)).toBeCloseTo(0.0127);
    expect(estimateProviderCost("openai", "whisper-1", { durationSeconds: 30 }, rates)).toBeCloseTo(0.005);
    expect(estimateProviderCost("anthropic", "test", { cacheReadTokens: 5 }, { "anthropic:test": { inputPerMillion: 2 } })).toBeNull();
  });
  it("rejects negative prices and silently misspelled fields", () => { expect(() => parseProviderRates('{"a":{"inputPerMillion":-1}}')).toThrow(); expect(() => parseProviderRates('{"a":{"inpt":2}}')).toThrow(); });
  it("isolates concurrent request context and stores no content", async () => {
    create.mockClear();
    await Promise.all(["one", "two"].map((userId) => providerContext.run(() => ({ userId, feature: "/test/:id" }), async () => { await new Promise((r) => setTimeout(r, userId === "one" ? 5 : 1)); await recordProviderUsage({ provider: "anthropic", model: "test", outcome: "OK", inputTokens: 12, latencyMs: 20 }); })));
    expect(create.mock.calls.map(([arg]) => arg.data.userId).sort()).toEqual(["one", "two"]);
    expect(Object.keys(create.mock.calls[0]![0].data)).not.toContain("prompt");
  });
});
