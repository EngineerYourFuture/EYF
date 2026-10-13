import { test, expect, type Page } from "@playwright/test";
import type { SprintNotes, SprintReport, SprintState } from "@eyf/types";
import { portal } from "./fixtures/lms";

const notes: SprintNotes = { explanation: "The authorization boundary must use the authenticated identity. I validate the requested page and limit before filtering, and break timestamp ties with a unique id.", sql: "SELECT id FROM tickets WHERE owner_id = $1 ORDER BY created_at DESC, id ASC LIMIT $2 OFFSET $3. An index on owner_id, created_at and id supports the filtered ordering.", tests: "Test two users with matching statuses and assert isolation. Test a final page and preserve the filtered total. Test limit zero and expect the INVALID_QUERY error response.", assistance: "ai" };
const result = { correct: 3, total: 6, topics: [{ key: "api" as const, label: "API correctness", correct: 1, total: 2 }, { key: "sql" as const, label: "Data access", correct: 1, total: 2 }, { key: "testing" as const, label: "Testing and reliability", correct: 1, total: 2 }] };
const report: SprintReport = { version: 1, name: "Aarav Kumar", startedAt: "2026-10-12T08:00:00Z", completedAt: "2026-10-12T09:15:00Z", baseline: result, retest: { ...result, correct: 6, topics: result.topics.map((t) => ({ ...t, correct: 2 })) }, challenge: { title: "Repair a ticket-list handler", slug: "backend-ticket-handler-v1", notes, evidence: { submissionId: "submission-1", submittedAt: "2026-10-12T09:00:00Z", language: "JAVASCRIPT", totalTests: 24, passedTests: 24, suiteHash: "a".repeat(64), codeHash: "b".repeat(64), taskVersion: 1 } }, assessmentMethod: "Two different six-question practice checks. Unproctored; these are not placement predictions.", reviewMethod: "Code checked by automated tests. Written sections are candidate-authored and have not been reviewed by a human. AI assistance is self-declared." };
const questions = (prefix: string) => Array.from({ length: 6 }, (_, i) => ({ id: `${prefix}${i}`, topic: "api" as const, prompt: `Question ${i + 1}: where should ownership come from?`, choices: ["The authenticated server context", "The query string"] }));
async function fixture(page: Page) {
  await portal(page);
  await page.addInitScript(() => localStorage.setItem("eyf-consent", "denied"));
  const state: SprintState = { step: "start", startedAt: null, questions: [], drills: [], baseline: null, retest: null, notes: null, challenge: { slug: "backend-ticket-handler-v1", title: "Repair a ticket-list handler", version: 1, testCount: 24 }, submission: null, report: null, share: null };
  const control = { fail: false, unavailable: false, failDrill: false };
  await page.route("**/v1/submissions/status", (route) => route.fulfill({ json: { success: true, data: { ready: false } } }));
  await page.route("**/v1/placement-sprint/**", async (route) => {
    const path = new URL(route.request().url()).pathname.split("/placement-sprint/")[1];
    const method = route.request().method(); const body = route.request().postDataJSON();
    if (control.fail) return route.fulfill({ status: 503, json: { success: false, error: { code: "UNAVAILABLE", message: "Service temporarily unavailable. Try again." } } });
    if (path?.startsWith("proof/")) {
      if (control.unavailable || !state.share) return route.fulfill({ status: 404, json: { success: false, error: { code: "NOT_FOUND", message: "This report is unavailable. Its link has expired or was revoked." } } });
      return route.fulfill({ json: { success: true, data: { report, issuedAt: "2026-10-12T10:00:00Z", expiresAt: "2026-11-11T10:00:00Z" } } });
    }
    if (path === "practice") return route.fulfill({ json: { success: true, data: { history: [], active: null, feedback: [] } } });
    if (path === "reviews") return route.fulfill({ json: { success: true, data: [] } });
    if (path === "start") { state.step = "baseline"; state.startedAt = report.startedAt; state.questions = questions("b"); }
    if (path === "baseline") { state.step = "drills"; state.baseline = result; state.questions = []; state.drills = [{ topic: "api", title: "Keep authorization separate from input", lesson: "Derive the ownership scope from authenticated server context. Validate the query before filtering and paging records.", question: { id: "d-api", topic: "api", prompt: "Which owner should the handler use?", choices: ["The authenticated owner", "The query owner"] } }]; }
    if (path === "drills") {
      if (control.failDrill) return route.fulfill({ status: 422, json: { success: false, error: { code: "SPRINT_STATE", message: "Review authorization and try the practice check again." } } });
      state.step = "challenge";
    }
    if (path === "notes") state.notes = body;
    if (path === "challenge") { state.notes = body; state.step = "retest"; state.questions = questions("r"); }
    if (path === "retest") { state.step = "report"; state.report = report; state.retest = report.retest; }
    if (path === "share") state.share = method === "DELETE" ? null : { token: "s".repeat(32), expiresAt: "2026-11-11T10:00:00Z" };
    return route.fulfill({ json: { success: true, data: state } });
  });
  return { state, control };
}
async function answerCheck(page: Page) {
  for (const group of await page.getByRole("group").all()) await group.getByRole("radio").first().check();
  await page.getByRole("button", { name: "Submit check" }).click();
}

test("learner completes a resumable sprint and explicitly shares and revokes evidence", async ({ page }, info) => {
  const { state, control } = await fixture(page);
  await page.goto("/sprint");
  await expect(page.getByRole("heading", { name: "Backend placement sprint" })).toBeVisible();
  await page.screenshot({ path: info.outputPath("sprint-desktop.png"), fullPage: true });
  await page.getByRole("button", { name: "Take the starting check" }).click();
  await page.getByRole("group").first().getByRole("radio").first().check();
  await page.reload();
  await expect(page.getByRole("group").first().getByRole("radio").first()).toBeChecked();
  await answerCheck(page);
  await expect(page.getByRole("heading", { name: "Turn your gaps into practice" })).toBeVisible();
  await page.getByRole("radio").first().check(); control.failDrill = true;
  await page.getByRole("button", { name: "Check practice and continue" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Review authorization" })).toBeVisible(); control.failDrill = false;
  await page.getByRole("button", { name: "Check practice and continue" }).click();
  await expect(page.getByRole("link", { name: /Open coding task/ })).toHaveAttribute("href", /lang=JAVASCRIPT/);
  await expect(page.getByText("Code execution is currently unavailable.", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Complete practical and reassess" })).toBeDisabled();
  await page.getByLabel("What did you fix, and why?").fill(notes.explanation);
  await page.getByLabel("SQL query and index proposal").fill(notes.sql);
  await page.getByLabel("Regression test plan").fill(notes.tests);
  await page.getByLabel("What help did you use?").selectOption("ai");
  await page.getByRole("button", { name: "Save written draft" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Draft saved" })).toBeVisible();
  await page.reload(); await expect(page.getByLabel("What did you fix, and why?")).toHaveValue(notes.explanation);
  state.submission = { id: "submission-1", verdict: "ACCEPTED", totalTests: 24, passedTests: 24, submittedAt: report.completedAt, eligible: true };
  await page.getByRole("button", { name: "Refresh result" }).click();
  await page.getByRole("button", { name: "Complete practical and reassess" }).click();
  await expect(page.getByRole("heading", { name: "Check what changed" })).toBeVisible();
  await answerCheck(page);
  await expect(page.getByRole("heading", { name: "A record of the work" })).toBeVisible();
  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("heading", { name: "A record of the work" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Backend placement sprint" })).toBeHidden();
  await page.emulateMedia({ media: "screen" });
  await expect(page.getByRole("button", { name: "Create public link" })).toBeDisabled();
  await page.getByRole("checkbox", { name: /I have reviewed/ }).check();
  await page.getByRole("button", { name: "Create public link" }).click();
  const url = await page.getByLabel("Public report link").inputValue();
  await page.goto(url); await expect(page.getByRole("heading", { name: "Practice evidence", exact: true })).toBeVisible();
  await expect(page.getByText(/24\/24 automated tests passed/)).toBeVisible();
  await page.goto("/sprint"); await page.getByRole("button", { name: "Revoke link" }).click();
  await expect(page.getByRole("button", { name: "Create public link" })).toBeDisabled();
  await page.goto(url); await expect(page.getByRole("heading", { name: "Report unavailable" })).toBeVisible();
});

test("mobile practical and public evidence stay readable with reduced motion", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.emulateMedia({ reducedMotion: "reduce" });
  const { state } = await fixture(page); state.step = "challenge"; state.startedAt = report.startedAt; state.notes = notes;
  await page.goto("/sprint"); await expect(page.getByRole("heading", { name: "Repair a ticket-list handler" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("sprint-mobile-practical.png"), fullPage: true });
  state.share = { token: "s".repeat(32), expiresAt: "2026-11-11" };
  await page.goto(`/proof/${state.share.token}`);
  await expect(page.getByRole("heading", { name: "A record of the work" })).toBeVisible();
  await page.evaluate(() => document.documentElement.classList.remove("light"));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("sprint-mobile-proof-dark.png"), fullPage: true });
});

test("failed load has a working recovery action", async ({ page }) => {
  const { control } = await fixture(page); control.fail = true;
  await page.goto("/sprint"); await expect(page.getByRole("alert").filter({ hasText: "couldn't load" })).toBeVisible();
  control.fail = false; await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.getByRole("button", { name: "Take the starting check" })).toBeVisible();
});

test("completed learner repeats practice and controls organization reviewer access", async ({ page }) => {
  const { state } = await fixture(page); state.step = "report"; state.report = report;
  let active = false, completed = false, requested = false, withdrawn = false;
  await page.route("**/v1/placement-sprint/practice**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() === "POST") { if (path.endsWith("start")) active = true; else { active = false; completed = true; } }
    await route.fulfill({ json: { success: true, data: { active: active ? { id: "round-1", sequence: 1, repeated: false, questions: questions("p") } : null, history: completed ? [{ id: "round-1", sequence: 1, bankVersion: 1, startedAt: report.completedAt, completedAt: report.completedAt, result: report.retest }] : [], feedback: completed ? [{ prompt: "What prevents duplicate writes?", answer: "A unique constraint", explanation: "The database arbitrates concurrent inserts." }] : [] } } });
  });
  await page.route("**/v1/placement-sprint/reviews**", async (route) => { if (route.request().method() === "POST") { expect(route.request().postDataJSON().consent).toBe(true); requested = true; } if (route.request().method() === "DELETE") withdrawn = true; await route.fulfill({ json: { success: true, data: requested ? [{ id: "review-1", organization: "Demo academy", requestedAt: report.completedAt, revokedAt: withdrawn ? report.completedAt : null, reviewedAt: null, rubric: null, feedback: null, reviewerName: null }] : [] } }); });
  await page.goto("/sprint"); await page.getByRole("button", { name: "Start another practice round" }).click();
  await page.getByRole("region", { name: "Keep the learning going" }).getByRole("group").first().getByRole("radio").first().check(); await page.reload(); await expect(page.getByRole("region", { name: "Keep the learning going" }).getByRole("group").first().getByRole("radio").first()).toBeChecked();
  for (const group of await page.getByRole("region", { name: "Keep the learning going" }).getByRole("group").all()) await group.getByRole("radio").first().check();
  await page.getByRole("button", { name: "Finish practice round" }).click(); await expect(page.getByText("Round 1: 6/6")).toBeVisible();
  await page.getByRole("combobox", { name: "Organization", exact: true }).selectOption("lms-org"); await expect(page.getByRole("button", { name: "Request practical review" })).toBeDisabled();
  await page.getByRole("checkbox", { name: /I allow this organization/ }).check(); await page.getByRole("button", { name: "Request practical review" }).click(); await expect(page.getByText("Demo academy · Awaiting review")).toBeVisible();
  await page.getByRole("button", { name: "Withdraw reviewer access" }).click(); await expect(page.getByText("Demo academy · Access withdrawn")).toBeVisible();
});
