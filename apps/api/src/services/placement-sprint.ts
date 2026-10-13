import { prisma } from "@eyf/db";
import type { SprintQuestion, SprintResult, SprintTopic, SprintDrill } from "@eyf/types";
import { testSuiteHash } from "./test-suite.js";

type Question = SprintQuestion & { answer: number };
export const TOPICS: Record<SprintTopic, string> = { api: "API correctness", sql: "Data access", testing: "Testing and reliability" };
export const BASELINE: Question[] = [
  { id: "b1", topic: "api", prompt: "A signed-in user changes the ownerId in a ticket-list query. Where should the API get the allowed owner?", choices: ["The query string", "The authenticated server context", "The first ticket", "The browser's local storage"], answer: 1 },
  { id: "b2", topic: "api", prompt: "A pagination endpoint receives page=-2. What should happen before querying data?", choices: ["Treat it as the last page", "Return every record", "Reject the invalid query", "Ignore all filters"], answer: 2 },
  { id: "b3", topic: "sql", prompt: "How should an API insert a user-supplied status into a SQL filter?", choices: ["Use a bound parameter", "Concatenate it into SQL", "Remove spaces only", "Trust a hidden form field"], answer: 0 },
  { id: "b4", topic: "sql", prompt: "Tickets have identical created_at values. Which ORDER BY gives repeatable ordering for a fixed dataset?", choices: ["created_at DESC only", "No ordering is needed", "A random value", "created_at DESC, id ASC with a unique id"], answer: 3 },
  { id: "b5", topic: "testing", prompt: "Which test is most likely to detect a ticket ownership leak?", choices: ["One user's own ticket appears", "Two owners have tickets; only the authenticated owner's appear", "The response is JSON", "The button has a label"], answer: 1 },
  { id: "b6", topic: "testing", prompt: "An API reports total=2 after slicing a 17-result query to a page of two. What is wrong?", choices: ["Nothing", "Total must equal page size", "Total should count filtered records before pagination", "Total should count all users' records"], answer: 2 },
];
export const RETEST: Question[] = [
  { id: "r1", topic: "api", prompt: "A request includes tenantId for another workspace. Which check belongs on the server?", choices: ["Trust the tenantId because the caller is logged in", "Check that the tenant exists only", "Check the caller's membership and scope for that tenant", "Hide the workspace switcher"], answer: 2 },
  { id: "r2", topic: "api", prompt: "An endpoint allows integer limits from 1 to 50. Which request must fail validation?", choices: ["limit=50", "limit=3.5", "limit=1", "limit=10"], answer: 1 },
  { id: "r3", topic: "sql", prompt: "A search term contains an apostrophe. Which approach preserves it safely as data?", choices: ["Build SQL with string interpolation", "Delete all punctuation", "Base64-encode the whole SQL statement", "Bind the search term as a query parameter"], answer: 3 },
  { id: "r4", topic: "sql", prompt: "A feed sorts by score descending. Equal scores shuffle between requests on an unchanged dataset. What should you add?", choices: ["A unique id as a secondary sort key", "A larger limit", "A random secondary sort key", "A second COUNT query"], answer: 0 },
  { id: "r5", topic: "testing", prompt: "A projects API must isolate organizations. Which regression case checks the boundary?", choices: ["An empty organization only", "All projects use the same organization", "Two organizations with similar projects; request as a member of one", "A snapshot of the heading"], answer: 2 },
  { id: "r6", topic: "testing", prompt: "A filtered search matches 11 rows. Page 4 has size 3 and returns 2 rows. What should total be?", choices: ["2", "3", "12", "11"], answer: 3 },
];
const DRILLS: Record<SprintTopic, SprintDrill & { answer: number }> = {
  api: { topic: "api", title: "Keep authorization separate from input", lesson: "Authentication identifies the caller. Authorization decides which records they can access. Derive the owner or tenant scope from verified server context, then apply validated query filters inside that scope. Check integer bounds before calculating an offset; reject invalid values instead of silently broadening access.", question: { id: "d-api", topic: "api", prompt: "A caller supplies ownerId=B but the session belongs to A. Which scope should the handler use?", choices: ["B", "A from the server session", "Both A and B"] }, answer: 1 },
  sql: { topic: "sql", title: "Filter, order, then paginate", lesson: "Bind values instead of concatenating SQL. Apply the same owner and status predicates to the count query and the page query. Use a unique secondary key to break ordering ties. For changing datasets, consider cursor pagination: deterministic ordering alone does not prevent offset pages shifting after inserts.", question: { id: "d-sql", topic: "sql", prompt: "When should you calculate the result total?", choices: ["After slicing the requested page", "Before filtering by owner", "After all filters, before pagination"] }, answer: 2 },
  testing: { topic: "testing", title: "Test the boundaries that break trust", lesson: "Start with a normal request, then test another owner's records, equal timestamps, an empty result, the last page, and invalid page sizes. Assert exact ids and totals, not just a successful response. A test plan describes intended checks; only executed tests demonstrate that the submitted code passed them.", question: { id: "d-testing", topic: "testing", prompt: "Which assertion catches a wrong last-page total?", choices: ["Assert both the last-page ids and the full filtered count", "Assert status 200 only", "Assert that the result is an object"] }, answer: 0 },
};
export function publicQuestions(bank: Question[]): SprintQuestion[] {
  return bank.map(({ id, topic, prompt, choices }) => ({ id, topic, prompt, choices }));
}
export function grade(bank: Question[], answers: Record<string, number>): SprintResult {
  const topics = (Object.keys(TOPICS) as SprintTopic[]).map((key) => {
    const items = bank.filter((q) => q.topic === key);
    return { key, label: TOPICS[key], correct: items.filter((q) => answers[q.id] === q.answer).length, total: items.length };
  });
  return { correct: topics.reduce((n, t) => n + t.correct, 0), total: bank.length, topics };
}
export function focusedDrills(result: SprintResult) {
  const gaps = result.topics.filter((t) => t.correct < t.total);
  return (gaps.length ? gaps : result.topics).map((t) => DRILLS[t.key]);
}

export const CHALLENGE_SLUG = "backend-ticket-handler-v1";
export const CHALLENGE_TITLE = "Repair a ticket-list handler";
const tickets = [
  { id: "a", ownerId: "u1", status: "open", createdAt: 10 },
  { id: "b", ownerId: "u1", status: "closed", createdAt: 30 },
  { id: "c", ownerId: "u2", status: "open", createdAt: 40 },
  { id: "d", ownerId: "u1", status: "open", createdAt: 30 },
  { id: "e", ownerId: "u1", status: "open", createdAt: 30 },
];
function tc(query: Record<string, unknown>, expected: unknown, isPublic = false, viewerId = "u1", records = tickets) {
  return { input: JSON.stringify({ viewerId, tickets: records, query }), expected: JSON.stringify(expected), isPublic };
}
// Versioned bank: changing any test requires a new task slug/version.
export const CHALLENGE_TESTS = [
  tc({ status: "open", page: 1, limit: 2 }, { ids: ["d", "e"], total: 3 }, true),
  tc({}, { ids: ["b", "d", "e", "a"], total: 4 }, true),
  tc({ status: "open", page: 2, limit: 2 }, { ids: ["a"], total: 3 }),
  tc({ ownerId: "u2", limit: 50 }, { ids: ["b", "d", "e", "a"], total: 4 }),
  tc({ status: "closed" }, { ids: ["b"], total: 1 }),
  tc({ page: 5, limit: 2 }, { ids: [], total: 4 }),
  tc({ page: 0 }, { error: "INVALID_QUERY" }),
  tc({ limit: 51 }, { error: "INVALID_QUERY" }),
  tc({ limit: 2.5 }, { error: "INVALID_QUERY" }),
  tc({ status: "deleted" }, { error: "INVALID_QUERY" }),
  tc({}, { ids: [], total: 0 }, false, "missing"),
  tc({ page: "1" }, { error: "INVALID_QUERY" }),
  tc({}, { ids: [], total: 0 }, false, "u1", []),
  tc({ page: -1 }, { error: "INVALID_QUERY" }),
  tc({ limit: 0 }, { error: "INVALID_QUERY" }),
  tc({ status: "open" }, { ids: ["c"], total: 1 }, false, "u2"),
  tc({ page: 1.5 }, { error: "INVALID_QUERY" }),
  tc({ page: null }, { error: "INVALID_QUERY" }),
  tc({ limit: null }, { error: "INVALID_QUERY" }),
  tc({ limit: "2" }, { error: "INVALID_QUERY" }),
  tc({ status: null }, { error: "INVALID_QUERY" }),
  tc({ status: "" }, { error: "INVALID_QUERY" }),
  tc({ limit: 1 }, { ids: ["b"], total: 4 }),
  tc({}, { ids: ["l", "k", "j", "i", "h", "g", "f", "e", "d", "c"], total: 12 }, false, "u1", Array.from({ length: 12 }, (_, i) => ({ id: String.fromCodePoint(97 + i), ownerId: "u1", status: "open", createdAt: i }))),
];
export const CHALLENGE_HASH = testSuiteHash(CHALLENGE_TESTS);
const description = `A support dashboard leaks other users' tickets and reports the wrong result count. Repair the handler logic below. This is a pure-function coding exercise, not a deployed HTTP service.

Read one JSON object from stdin and print one compact JSON object to stdout.

Input: { viewerId, tickets, query }. viewerId is the authenticated server identity. Tickets have unique lowercase ASCII string ids, string ownerIds, status "open" or "closed", and integer createdAt values. Ticket data is valid. query is an object.

Rules:
1. Return only tickets owned by viewerId. Ignore query.ownerId and any unknown query keys.
2. Optional query.status must be "open" or "closed"; if absent, include both.
3. Optional page defaults to 1 and limit defaults to 10. If supplied, they must be JSON integers: page >= 1 and limit from 1 to 50. Strings and null are invalid. Invalid status/page/limit returns exactly {"error":"INVALID_QUERY"}.
4. Sort matching tickets by createdAt descending, then id ascending (ASCII).
5. Paginate after filtering and sorting. Output {"ids":[...],"total":N} in that key order. total counts all matching tickets before pagination. An out-of-range page has empty ids and the same total.

Use JavaScript's starter to repair the faulty handler, or implement the same contract in another language. The wrapper reads stdin and prints JSON. Do not print debug output.

After your submission passes, return to Placement sprint. Explain the authorization fix, propose a parameterized SQL query and index, and describe at least three regression tests. These written sections are candidate-authored and are not automatically graded.`;
const starter = `const fs = require("fs");
function listTickets({ viewerId, tickets, query }) {
  // BUGS: trusts client ownership, ignores status/validation, sorts incorrectly,
  // and counts the sliced page. Repair this handler to match the specification.
  const page = query.page || 1;
  const limit = query.limit || 10;
  const rows = tickets.filter(t => t.ownerId === (query.ownerId || viewerId));
  rows.sort((a, b) => a.createdAt - b.createdAt);
  const selected = rows.slice((page - 1) * limit, page * limit);
  return { ids: selected.map(t => t.id), total: selected.length };
}
console.log(JSON.stringify(listTickets(JSON.parse(fs.readFileSync(0, "utf8")))));
`;

export async function ensureChallenge() {
  // Create once, never silently replace a published bank or learners' history.
  const problem = await prisma.problem.upsert({
    where: { slug: CHALLENGE_SLUG }, update: {},
    create: { slug: CHALLENGE_SLUG, title: CHALLENGE_TITLE, description, difficulty: "MEDIUM", topics: ["Backend", "Authorization", "Pagination"], patterns: [], companies: [], premium: false,
      starterCode: { create: { language: "JAVASCRIPT", code: starter } },
      testCases: { create: CHALLENGE_TESTS.map((t, orderIndex) => ({ ...t, orderIndex, weight: 1 })) },
    },
    include: { testCases: { orderBy: { orderIndex: "asc" } } },
  });
  if (testSuiteHash(problem.testCases) !== CHALLENGE_HASH) throw Object.assign(new Error("This task's test bank has changed. Ask the EYF team to restore version 1 before continuing."), { statusCode: 409 });
  return problem;
}
