import { describe, it, expect } from "vitest";
import { CHALLENGE_TESTS, CHALLENGE_HASH } from "./placement-sprint.js";
import { testSuiteHash } from "./test-suite.js";

// Trusted reference implementation, never an evaluator of learner-supplied code.
function reference(input: string) {
  const { viewerId, tickets, query } = JSON.parse(input) as { viewerId: string; tickets: { id: string; ownerId: string; createdAt: number; status: string }[]; query: Record<string, unknown> };
  const page = query.page === undefined ? 1 : query.page;
  const limit = query.limit === undefined ? 10 : query.limit;
  if (typeof page !== "number" || !Number.isInteger(page) || page < 1 || typeof limit !== "number" || !Number.isInteger(limit) || limit < 1 || limit > 50 || (query.status !== undefined && !["open", "closed"].includes(query.status as string))) return JSON.stringify({ error: "INVALID_QUERY" });
  const rows = tickets.filter((t) => t.ownerId === viewerId && (query.status === undefined || t.status === query.status));
  rows.sort((a, b) => b.createdAt - a.createdAt || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return JSON.stringify({ ids: rows.slice((page - 1) * limit, page * limit).map((t) => t.id), total: rows.length });
}
describe("backend practical content", () => {
  it.each(CHALLENGE_TESTS.map((t, index) => ({ ...t, index })))("has a correct expected output for case $index", ({ input, expected }) => { expect(reference(input)).toBe(expected); });
  it("fingerprints public/hidden classification, ordering and exact input/output values", () => {
    expect(testSuiteHash(CHALLENGE_TESTS)).toBe(CHALLENGE_HASH);
    expect(testSuiteHash([...CHALLENGE_TESTS].reverse())).not.toBe(CHALLENGE_HASH);
    expect(testSuiteHash(CHALLENGE_TESTS.map((t) => ({ ...t, isPublic: !t.isPublic })))).not.toBe(CHALLENGE_HASH);
  });
});
