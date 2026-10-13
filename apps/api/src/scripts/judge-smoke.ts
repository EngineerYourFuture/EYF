import "dotenv/config";
import { submitToJudge0, getJudge0Result } from "../services/judge0.js";
import { env } from "../env.js";

// Synthetic source only. No learner work or credentials are printed or uploaded.
const cases = [
  { name: "JavaScript execution", language: "JAVASCRIPT" as const, sourceCode: "console.log(6 * 7)", expectedOutput: "42" },
  { name: "SQLite fixture execution", language: "SQL" as const, sourceCode: "CREATE TABLE n(v INTEGER); INSERT INTO n VALUES(20),(22); SELECT SUM(v) FROM n;", expectedOutput: "42" },
  { name: "Wrong-answer detection", language: "JAVASCRIPT" as const, sourceCode: "console.log(41)", expectedOutput: "42", expectedVerdict: "WRONG_ANSWER" },
];
try {
  const response = await fetch(`${env.JUDGE0_URL}/about`, { headers: env.JUDGE0_TOKEN ? { "X-Auth-Token": env.JUDGE0_TOKEN } : {}, signal: AbortSignal.timeout(3000) });
  if (!response.ok) { throw new Error("Judge API authentication or readiness failed."); }
  await response.body?.cancel();
  for (const test of cases) {
    const token = await submitToJudge0(test), deadline = Date.now() + 30_000;
    let verdict = "PENDING";
    while (Date.now() < deadline) { const result = await getJudge0Result(token); verdict = result.verdict; if (result.finished) { break; } await new Promise((r) => setTimeout(r, 500)); }
    const ok = verdict === (test.expectedVerdict ?? "ACCEPTED");
    console.log(`${ok ? "PASS" : "FAIL"}: ${test.name} (${verdict})`);
    if (!ok) { process.exitCode = 1; }
  }
} catch { console.error("FAIL: Judge is unavailable. Check its host, authentication and both worker services before enabling execution."); process.exitCode = 1; }
