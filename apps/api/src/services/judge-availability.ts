import { judgeQueue } from "../jobs/queue.js";
import { env } from "../env.js";

let cached: { ready: boolean; until: number } | null = null;
let pending: Promise<boolean> | null = null;
/** A short, cached probe of both execution dependencies. Never exposes config. */
export async function judgeAvailable(): Promise<boolean> {
  if (cached && cached.until > Date.now()) return cached.ready;
  if (pending) return pending;
  pending = (async () => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const probe = Promise.all([
        judgeQueue.getWorkers(),
        fetch(`${env.JUDGE0_URL}/about`, { headers: env.JUDGE0_TOKEN ? { "X-Auth-Token": env.JUDGE0_TOKEN } : {}, signal: AbortSignal.timeout(1500) }).then(async (response) => { await response.body?.cancel(); return response.ok; }),
      ]).then(([workers, judgeReady]) => workers.length > 0 && judgeReady);
      const ready = await Promise.race([probe, new Promise<false>((resolve) => { timer = setTimeout(() => resolve(false), 1600); })]);
      cached = { ready, until: Date.now() + 15_000 }; return ready;
    } catch { cached = { ready: false, until: Date.now() + 15_000 }; return false; }
    finally { clearTimeout(timer); pending = null; }
  })();
  return pending;
}
