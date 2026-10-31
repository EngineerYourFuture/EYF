import { spawnSync } from "node:child_process";
import { describe, it, expect } from "vitest";
import { SQL_LABS } from "./practical-labs.js";

// Only repository-authored SQL and fixtures run here. Learner queries always
// use the isolated remote judge, never this test-only local reference harness.
function executeFixture(setup: string, query: string) {
  const result = spawnSync("python3", ["-c", "import json,sys,sqlite3\nx=json.load(sys.stdin)\nc=sqlite3.connect(':memory:')\nc.executescript(x['setup'])\nfor row in c.execute(x['query']): print('|'.join(str(v) if v is not None else '' for v in row))"], { input: JSON.stringify({ setup, query }), encoding: "utf8", timeout: 3000 });
  if (result.status !== 0) throw new Error(result.stderr || result.error?.message || "SQL reference failed");
  return result.stdout.trim();
}
describe("versioned SQL lab fixtures", () => {
  for (const lab of SQL_LABS) {
    for (const [index, tc] of lab.tests.entries()) it(`${lab.slug} reference matches case ${index + 1}`, () => { expect(executeFixture(tc.input, lab.reference)).toBe(tc.expected); });
    it(`${lab.slug} rejects its faulty starter`, () => { expect(lab.tests.some((tc) => executeFixture(tc.input, lab.starter) !== tc.expected)).toBe(true); });
  }
});
