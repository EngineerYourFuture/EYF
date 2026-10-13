import { createHash } from "node:crypto";

/** Fingerprint exactly the ordered inputs/outputs used by the worker. */
export function testSuiteHash(tests: readonly { input: string; expected: string; isPublic: boolean }[]) {
  return createHash("sha256").update(JSON.stringify(tests.map(({ input, expected, isPublic }) => ({ input, expected, isPublic })))).digest("hex");
}
