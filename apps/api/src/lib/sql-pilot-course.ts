import type { LessonBlock } from "@eyf/types";

type PilotLesson = { title: string; estMinutes: number; blocks: LessonBlock[] };
export const SQL_PILOT_TITLE = "SQL for reliable backend features";
export const SQL_PILOT_DESCRIPTION = "A guided pilot: scope a private ticket queue, handle ties, and reconcile paid orders without losing customers. Five lessons, two executable labs, and a final reasoning check. Requires basic SELECT and WHERE knowledge.";
export const SQL_PILOT_LESSONS: PilotLesson[] = [
  { title: "Start with a trusted scope", estMinutes: 15, blocks: [
    { type: "heading", data: { text: "A correct query starts before SQL" } },
    { type: "rich_text", data: { text: "A ticket list must show only the authenticated caller’s tickets. The API derives the caller from a verified session and checks workspace membership. A user-supplied owner_id is a requested value, not proof of permission. For this course’s sandbox, request_context contains one trusted viewer_id. Join tickets.owner_id to that value and filter status='open'. Parameter binding prevents SQL injection; it does not replace authorization." } },
    { type: "code", data: { code: "-- Illustrative shape; the server supplies the trusted scope.\nSELECT t.id\nFROM tickets AS t\nJOIN request_context AS r ON r.viewer_id = t.owner_id\nWHERE t.status = 'open';" } },
    { type: "callout", data: { text: "Before running a query, predict its output for: another owner’s open ticket, your closed ticket, and an empty table. Passing this SQL lab proves query behavior, not the security of an entire application." } },
    { type: "quiz", data: { question: "Where should the viewer identity used to scope a private query come from?", choices: ["A verified session resolved by the server", "The owner_id typed into a URL", "A hidden HTML input"], correctIndex: 0 } },
  ] },
  { title: "Make ordering predictable", estMinutes: 25, blocks: [
    { type: "rich_text", data: { text: "Two rows can have the same timestamp. ORDER BY created_at DESC leaves their relative order unspecified. Add a unique tie-breaker: ORDER BY created_at DESC, id ASC. With (id=9,time=8), (id=2,time=8), (id=5,time=8), the required order is 2,5,9. Stable ordering is also necessary for reliable pagination. Test zero, equal, and negative timestamps; do not assume newer means positive." } },
    { type: "callout", data: { text: "Lab: return open tickets for the trusted viewer, newest first, using id ascending to break ties. Read the public fixture, predict the output, then implement the query. Fix one failure at a time. Return here after the judge accepts your submission." } },
    { type: "judged_code", data: { problemSlug: "sql-private-ticket-queue-v1" } },
    { type: "quiz", data: { question: "Why is created_at DESC alone insufficient here?", choices: ["SQL always sorts ties by primary key", "Equal timestamps need an explicit unique tie-breaker", "Descending order removes duplicate rows"], correctIndex: 1 } },
  ] },
  { title: "Keep customers with no paid orders", estMinutes: 20, blocks: [
    { type: "rich_text", data: { text: "A customer report must retain people with no matching orders. Start from customers and LEFT JOIN orders. Put o.status='paid' in the join’s ON clause. A WHERE condition on the joined order would reject the NULL row produced for an unmatched customer. COUNT(o.id) counts matching orders; COUNT(*) would count the preserved customer row as one. SUM returns NULL when there are no values, so COALESCE(SUM(o.amount_cents), 0) represents a zero total." } },
    { type: "code", data: { code: "SELECT c.id, COUNT(o.id), COALESCE(SUM(o.amount_cents), 0)\nFROM customers AS c\nLEFT JOIN orders AS o\n  ON o.customer_id = c.id AND o.status = 'paid'\nGROUP BY c.id\nORDER BY c.id;" } },
    { type: "quiz", data: { question: "A customer has no orders. What should the report show for paid-order count and total cents?", choices: ["No customer row", "1 and NULL", "0 and 0"], correctIndex: 2 } },
    { type: "quiz", data: { question: "Where should the paid-status condition go to preserve unmatched customers?", choices: ["In this LEFT JOIN’s ON clause", "In a WHERE clause requiring an order", "In ORDER BY"], correctIndex: 0 } },
  ] },
  { title: "Reconcile paid revenue against edge cases", estMinutes: 25, blocks: [
    { type: "rich_text", data: { text: "Use integer cents throughout this exercise. Two paid orders of 200 cents contribute a count of 2 and a total of 400. SUM(DISTINCT amount_cents) would incorrectly collapse them. A zero-valued paid order still contributes to the count. Group by customer ID rather than name because two customers may share a name. Cancelled orders contribute neither count nor total." } },
    { type: "callout", data: { text: "Lab: keep every customer and reconcile only paid orders. Before submitting, make a small expected-results table covering no orders, cancelled-only orders, duplicate amounts, zero payments, and duplicate names. The lesson completes only after an accepted submission." } },
    { type: "judged_code", data: { problemSlug: "sql-paid-revenue-v1" } },
    { type: "quiz", data: { question: "Two paid orders have the same amount. How should they contribute?", choices: ["Count both and sum both", "Count both but sum one", "Count one and sum one"], correctIndex: 0 } },
  ] },
  { title: "Explain the result and review the evidence", estMinutes: 15, blocks: [
    { type: "rich_text", data: { text: "Prepare a five-minute walkthrough for your instructor: identify the trusted scope, explain the LEFT JOIN filter location, justify the tie-breaker, and demonstrate one failure your tests caught. Use the actual accepted submissions and course progress as evidence. An accepted query does not establish production performance; inspect the real execution plan and data distribution before choosing indexes." } },
    { type: "callout", data: { text: "Instructor review rubric: correct scope, deterministic ordering, correct zero/NULL handling, correct duplicate handling, and a clear explanation of tests. Record feedback in the cohort follow-up. Completion means every lesson and both labs are passed. Certificates and timed assessments remain separately configured by your organization." } },
    { type: "quiz", data: { question: "What does an accepted lab submission establish?", choices: ["The whole application is secure and scalable", "The submitted query passed the configured test cases", "All possible data and authorization cases were proved"], correctIndex: 1 } },
  ] },
];
