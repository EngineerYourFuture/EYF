import { request } from "undici";
import { env } from "../env.js";
import { Language, Verdict } from "@eyf/db";

// Judge0 language IDs (CE v1.13.x). https://github.com/judge0/judge0/blob/master/CHANGELOG.md
export const JUDGE0_LANG_ID: Record<Language, number> = {
  CPP:        54,  // C++ (GCC 9.2.0)
  JAVA:       62,  // Java (OpenJDK 13)
  PYTHON:     71,  // Python 3.8.1
  JAVASCRIPT: 63,  // Node 12.14
  TYPESCRIPT: 74,  // TS 3.7.4
  GO:         60,  // Go 1.13.5
  C:          50,  // C (GCC 9.2.0)
  RUST:       73,  // Rust 1.40.0
  KOTLIN:     78,  // Kotlin 1.3.70
  CSHARP:     51,  // C# Mono 6.6.0.161
};

// Judge0 status_id → our Verdict.
function mapStatus(statusId: number): Verdict {
  if (statusId === 1 || statusId === 2) return Verdict.PENDING;
  if (statusId === 3) return Verdict.ACCEPTED;
  if (statusId === 4) return Verdict.WRONG_ANSWER;
  if (statusId === 5) return Verdict.TIME_LIMIT;
  if (statusId === 6) return Verdict.COMPILE_ERROR;
  if (statusId >= 7 && statusId <= 12) return Verdict.RUNTIME_ERROR;
  if (statusId === 13 || statusId === 14) return Verdict.INTERNAL_ERROR;
  return Verdict.INTERNAL_ERROR;
}

function authHeaders() {
  return env.JUDGE0_TOKEN ? { "X-Auth-Token": env.JUDGE0_TOKEN } : {};
}

export type Judge0SubmitInput = {
  language: Language;
  sourceCode: string;
  stdin?: string;
  expectedOutput?: string;
  timeLimitSeconds?: number;
  memoryLimitKb?: number;
};

export async function submitToJudge0(input: Judge0SubmitInput): Promise<string> {
  const url = `${env.JUDGE0_URL}/submissions?base64_encoded=true&wait=false`;
  const body = {
    language_id: JUDGE0_LANG_ID[input.language],
    source_code: Buffer.from(input.sourceCode, "utf8").toString("base64"),
    stdin: input.stdin ? Buffer.from(input.stdin, "utf8").toString("base64") : undefined,
    expected_output: input.expectedOutput
      ? Buffer.from(input.expectedOutput, "utf8").toString("base64")
      : undefined,
    cpu_time_limit: input.timeLimitSeconds ?? 2,
    memory_limit: input.memoryLimitKb ?? 262_144,
  };
  const res = await request(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (res.statusCode >= 400) {
    const text = await res.body.text();
    throw new Error(`Judge0 submit ${res.statusCode}: ${text}`);
  }
  const json = (await res.body.json()) as { token: string };
  return json.token;
}

export type Judge0Result = {
  verdict: Verdict;
  runtimeMs: number | null;
  memoryKb: number | null;
  stdout: string | null;
  stderr: string | null;
  compileOutput: string | null;
  rawStatus: number;
  finished: boolean;
};

export async function getJudge0Result(token: string): Promise<Judge0Result> {
  const url = `${env.JUDGE0_URL}/submissions/${token}?base64_encoded=true&fields=stdout,stderr,compile_output,status,time,memory`;
  const res = await request(url, { headers: authHeaders() });
  if (res.statusCode >= 400) {
    const text = await res.body.text();
    throw new Error(`Judge0 get ${res.statusCode}: ${text}`);
  }
  const j = (await res.body.json()) as {
    stdout: string | null;
    stderr: string | null;
    compile_output: string | null;
    status: { id: number };
    time: string | null;
    memory: number | null;
  };
  const verdict = mapStatus(j.status.id);
  return {
    verdict,
    runtimeMs: j.time ? Math.round(parseFloat(j.time) * 1000) : null,
    memoryKb: j.memory ?? null,
    stdout: j.stdout ? Buffer.from(j.stdout, "base64").toString("utf8") : null,
    stderr: j.stderr ? Buffer.from(j.stderr, "base64").toString("utf8") : null,
    compileOutput: j.compile_output
      ? Buffer.from(j.compile_output, "base64").toString("utf8")
      : null,
    rawStatus: j.status.id,
    finished: verdict !== Verdict.PENDING,
  };
}
