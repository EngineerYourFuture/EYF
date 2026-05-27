import { env } from "../config/env";

export const JUDGE0_LANG: Record<string, number> = {
  javascript: 93, // Node.js 18
  python:     71, // Python 3.8
  java:       91, // Java 17
  cpp:        54, // C++17
  c:          50, // C (GCC 9)
};

interface Judge0Submission {
  stdout:          string | null;
  stderr:          string | null;
  compile_output:  string | null;
  status:          { id: number; description: string };
  time:            string | null;
  memory:          number | null;
}

export interface ExecResult {
  stdout:    string;
  stderr:    string;
  exitCode:  number;
  runtimeMs: number;
  memoryKb:  number;
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (env.judge0ApiKey) h["X-RapidAPI-Key"] = env.judge0ApiKey;
  return h;
}

export async function runOnJudge0(
  code: string,
  language: string,
  stdin: string,
): Promise<ExecResult> {
  const langId = JUDGE0_LANG[language];
  if (!langId) throw new Error(`Unsupported language: ${language}`);

  const res = await fetch(
    `${env.judge0ApiUrl}/submissions?base64_encoded=false&wait=true`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        source_code: code,
        language_id: langId,
        stdin,
        cpu_time_limit: 5,
        memory_limit: 262144,
      }),
      signal: AbortSignal.timeout(15000),
    },
  );

  if (!res.ok) throw new Error(`Judge0 HTTP ${res.status}`);
  const r = await res.json() as Judge0Submission;

  return {
    stdout:    r.stdout ?? "",
    stderr:    (r.stderr ?? "") || (r.compile_output ?? ""),
    exitCode:  r.status.id === 3 ? 0 : 1, // 3 = Accepted
    runtimeMs: r.time ? Math.round(Number.parseFloat(r.time) * 1000) : 0,
    memoryKb:  r.memory ?? 0,
  };
}

export type Judge0HealthStatus = "ok" | "degraded" | "down";

export async function checkJudge0Health(): Promise<{
  status: Judge0HealthStatus;
  latencyMs: number;
}> {
  const start = Date.now();
  try {
    let res = await fetch(`${env.judge0ApiUrl}/system_info`, {
      headers: headers(),
      signal: AbortSignal.timeout(5000),
    });
    // Some instances return 401/403 on /system_info without admin auth but are
    // otherwise fully functional — fall back to the lighter /languages probe.
    if (res.status === 401 || res.status === 403) {
      res = await fetch(`${env.judge0ApiUrl}/languages`, {
        headers: headers(),
        signal: AbortSignal.timeout(5000),
      });
    }
    return { status: res.ok ? "ok" : "degraded", latencyMs: Date.now() - start };
  } catch {
    return { status: "down", latencyMs: Date.now() - start };
  }
}
