import { test, expect } from "@playwright/test";
import { portal } from "./fixtures/lms";
const LMS = process.env.E2E_LMS_URL ?? "http://localhost:3001";

test("college staff import a roster, set drive rules, follow up and download a report", async ({ page }, info) => {
  const state = await portal(page); state.program = "Backend placement"; state.published = true; state.attached = true; state.cohort = "October cohort";
  await page.addInitScript(() => localStorage.setItem("eyf-consent", "denied"));
  const report = { cohort: { driveTitle: null as string | null, driveDeadline: null, minimumProgress: 100 }, funnel: { enrolled: 0, completed: 0, eligible: 0, stuck: 1 }, rows: [] as { enrollmentId: string; member: { id: string; name: string; email: string }; progressPct: number; stuckFlag: boolean; eligibility: { eligible: boolean; reasons: string[] }; followUp: { status: string; note: string; dueAt: string | null; overdue: boolean } }[] };
  await page.route("**/v1/orgs/lms-org/cohorts/cohort-1/**", async (route) => {
    const request = route.request(), path = new URL(request.url()).pathname.split("/").pop(), body = request.postDataJSON();
    let data: unknown = {};
    if (path === "funnel") data = report;
    if (path === "import") {
      data = { rows: [{ row: 2, email: "learner@example.test", status: "ready" }, { row: 3, email: "outsider@example.test", status: "unavailable" }], ready: 1, previewHash: "preview-1", enrolled: body.commit ? 1 : 0 };
      if (body.commit) { expect(body.previewHash).toBe("preview-1"); state.enrolled = true; report.funnel.enrolled = 1; report.rows = [{ enrollmentId: "enrollment-1", member: { id: "member-1", name: "Learner One", email: "learner@example.test" }, progressPct: 50, stuckFlag: true, eligibility: { eligible: false, reasons: ["100% required; 50% achieved."] }, followUp: { status: "NONE", note: "", dueAt: null, overdue: false } }]; }
    }
    if (path === "drive") report.cohort = body;
    if (path === "enrollment-1") report.rows[0]!.followUp = { ...body, overdue: false };
    if (path === "export") data = { filename: "cohort-report.csv", csv: '"Name","Progress"\r\n"Learner One","50"\r\n' };
    await route.fulfill({ json: { success: true, data } });
  });
  await page.goto(`${LMS}/orgs`); await page.getByRole("tab", { name: "Cohorts", exact: true }).click(); await page.getByRole("combobox", { name: "Manage cohort", exact: true }).selectOption("cohort-1");
  await page.locator("summary").filter({ hasText: "Import learners from CSV" }).click();
  await page.getByLabel("CSV file", { exact: true }).setInputFiles({ name: "roster.csv", mimeType: "text/csv", buffer: Buffer.from("email\nlearner@example.test\noutsider@example.test") });
  await page.getByRole("button", { name: "Preview import" }).click();
  await expect(page.getByText("Invite or check access", { exact: true })).toBeVisible();
  await expect(page.getByText("1 ready to enroll · 2 rows checked")).toBeVisible();
  await page.getByRole("button", { name: "Enroll 1 learner" }).click(); await expect(page.getByRole("status").filter({ hasText: "1 learner enrolled" })).toBeVisible();
  await page.locator("summary").filter({ hasText: "Placement drive criteria" }).click();
  await page.getByLabel("Drive name (optional)").fill("October backend drive"); await page.getByLabel("Minimum program completion (%)", { exact: true }).fill("80"); await page.getByRole("button", { name: "Save drive criteria" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Drive criteria saved" })).toBeVisible();
  await page.locator("summary").filter({ hasText: "Follow-up for Learner One" }).click();
  await page.getByRole("combobox", { name: "Status", exact: true }).selectOption("OPEN"); await page.getByRole("textbox", { name: "Staff note", exact: true }).fill("Discuss the SQL lab before the next placement session."); await page.getByRole("button", { name: "Save follow-up" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Follow-up saved" })).toBeVisible();
  const download = page.waitForEvent("download"); await page.getByRole("button", { name: "Download progress CSV" }).click(); expect((await download).suggestedFilename()).toBe("cohort-report.csv");
  await page.screenshot({ path: info.outputPath("cohort-operations-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 }); await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator("summary").filter({ hasText: "Follow-up for Learner One" }).click(); await expect(page.getByRole("textbox", { name: "Staff note", exact: true })).toHaveValue("Discuss the SQL lab before the next placement session.");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("cohort-operations-mobile.png"), fullPage: true });
});

test("reviewer reads consented practical work and publishes final rubric feedback", async ({ page }, info) => {
  await portal(page); await page.addInitScript(() => localStorage.setItem("eyf-consent", "denied"));
  const review = { id: "review-1", name: "Learner One", notes: { explanation: "I derive ownership from authenticated server context and validate pagination before reading records.", sql: "A bound owner parameter and stable ordering keep data access scoped.", tests: "Cover two owners, tied timestamps and an empty final page.", assistance: "ai" }, evidence: { passedTests: 24, totalTests: 24 }, code: "console.log('submitted source');", reviewedAt: null as string | null, rubric: null as object | null, feedback: null as string | null, reviewerName: null as string | null };
  await page.route("**/v1/orgs/lms-org/sprint-reviews**", async (route) => { const detail = new URL(route.request().url()).pathname.endsWith("review-1"); if (route.request().method() === "POST") { const body = route.request().postDataJSON(); review.rubric = body.rubric; review.feedback = body.feedback; review.reviewedAt = new Date().toISOString(); review.reviewerName = "Course reviewer"; } await route.fulfill({ json: { success: true, data: detail ? review : [{ id: "review-1", name: review.name, requestedAt: "2026-10-12", reviewedAt: review.reviewedAt }] } }); });
  await page.goto(`${LMS}/orgs`); await page.getByRole("tab", { name: "Reviews", exact: true }).click(); await page.getByRole("button", { name: "Open Learner One's practical" }).click();
  await page.locator("summary").filter({ hasText: "Submitted source code" }).click(); await expect(page.getByText("console.log('submitted source');", { exact: true })).toBeVisible();
  for (const label of ["Authorization", "SQL and data access", "Regression testing", "Engineering explanation"]) await page.getByRole("combobox", { name: label, exact: true }).selectOption("2");
  await page.getByLabel("Strengths, gaps and next step").fill("Good scope handling. Add a test for invalid limits and explain how the compound index serves ordering.");
  await page.getByRole("button", { name: "Publish final feedback" }).click(); await expect(page.getByText("Reviewed by Course reviewer")).toBeVisible(); await expect(page.getByRole("button", { name: "Publish final feedback" })).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("practical-review-desktop.png"), fullPage: true });
});

test("SQL labs show execution availability and open the SQL editor", async ({ page }, info) => {
  await portal(page); await page.addInitScript(() => localStorage.setItem("eyf-consent", "denied"));
  await page.route("**/v1/labs", (route) => route.fulfill({ json: { success: true, data: [{ slug: "sql-private-ticket-queue-v1", title: "Build a private ticket queue", summary: "Read trusted scope, filter open tickets and make tied ordering deterministic.", tests: 6, completed: false }] } }));
  await page.route("**/v1/submissions/status", (route) => route.fulfill({ json: { success: true, data: { ready: false } } }));
  await page.route("**/v1/labs/prepare", (route) => route.fulfill({ json: { success: true, data: { ready: true } } }));
  await page.route("**/v1/problems/sql-private-ticket-queue-v1", (route) => route.fulfill({ json: { success: true, data: { id: "sql-1", slug: "sql-private-ticket-queue-v1", title: "Build a private ticket queue", description: "Select open tickets for the trusted owner.", executionMode: "SQL", difficulty: "MEDIUM", patterns: [], companies: [], starterCode: [{ language: "SQL", code: "SELECT id FROM tickets;" }], testCases: [{ input: "CREATE TABLE tickets(id INTEGER);", expected: "" }] } } }));
  await page.addInitScript(() => localStorage.setItem("eyf-theme", "dark"));
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto("/labs"); await expect(page.getByText(/Code execution is currently unavailable/)).toBeVisible();
  await expect(page.locator("html")).toHaveClass(/dark/); await page.screenshot({ path: info.outputPath("sql-labs-mobile-dark.png"), fullPage: true });
  await page.getByRole("button", { name: "Open SQL lab" }).click(); await expect(page.getByLabel("Programming language")).toHaveValue("SQL"); await expect(page.getByLabel("Programming language").locator("option")).toHaveCount(1);
});
