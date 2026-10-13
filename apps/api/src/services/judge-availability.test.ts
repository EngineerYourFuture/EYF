import { afterEach, describe, expect, it, vi } from "vitest";
const workers = vi.hoisted(() => vi.fn());
vi.mock("../jobs/queue.js", () => ({ judgeQueue: { getWorkers: workers } }));
vi.mock("../env.js", () => ({ env: { JUDGE0_URL: "http://judge.test" } }));
afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); workers.mockReset(); });
describe("execution availability", () => {
  it("needs both the judge and a queue worker, and caches successful probes", async () => {
    workers.mockResolvedValue([{}]); const fetcher = vi.fn().mockResolvedValue(new Response("{}")); vi.stubGlobal("fetch", fetcher);
    const { judgeAvailable } = await import("./judge-availability.js");
    expect(await judgeAvailable()).toBe(true); expect(await judgeAvailable()).toBe(true); expect(fetcher).toHaveBeenCalledOnce();
  });
  it("reports unavailable when the worker is missing even if the judge answers", async () => {
    workers.mockResolvedValue([]); vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}")));
    expect(await (await import("./judge-availability.js")).judgeAvailable()).toBe(false);
  });
  it("reports an offline judge without leaking its error", async () => {
    workers.mockResolvedValue([{}]); vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("private connection details")));
    expect(await (await import("./judge-availability.js")).judgeAvailable()).toBe(false);
  });
});
