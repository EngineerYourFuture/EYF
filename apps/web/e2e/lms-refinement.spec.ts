import { expect, test, type Page } from "@playwright/test";
import { portal } from "./fixtures/lms";

test.use({ baseURL: process.env.E2E_LMS_URL ?? "http://localhost:3001" });
const builder = "/orgs/lms-org/build/course-1";

test("editor rows retain their DOM identity and correct answer through moves and removals", async ({ page }) => {
  const state = await setup(page);
  state.blocks = [
    { type: "rich_text", data: { text: "First paragraph" } },
    { type: "rich_text", data: { text: "Keep this paragraph" } },
    { type: "quiz", data: { question: "Which remains?", choices: ["Remove", "Keep", "Correct"], correctIndex: 2 } },
  ];
  await page.goto(builder);
  await page.getByLabel("Text 2", { exact: true }).evaluate((element) => { element.setAttribute("data-retained", "paragraph"); });
  await page.getByRole("button", { name: "Move block 2 up", exact: true }).click();
  await expect(page.getByLabel("Text 1", { exact: true })).toHaveAttribute("data-retained", "paragraph");
  await page.getByRole("button", { name: "Remove block 2", exact: true }).click();
  await page.getByLabel("Quiz 2 answer 3", { exact: true }).evaluate((element) => { element.setAttribute("data-retained", "answer"); });
  await page.getByRole("button", { name: "Remove quiz 2 answer 1", exact: true }).click();
  await expect(page.getByLabel("Quiz 2 answer 2", { exact: true })).toHaveAttribute("data-retained", "answer");
  await expect(page.getByRole("radio", { name: "Correct answer 2", exact: true })).toBeChecked();
  const warning = page.waitForEvent("dialog");
  await page.evaluate(() => { setTimeout(() => location.reload(), 0); });
  const dialog = await warning;
  expect(dialog.type()).toBe("beforeunload");
  await dialog.dismiss();
  await expect(page.getByLabel("Text 1", { exact: true })).toHaveValue("Keep this paragraph");
  await page.getByRole("button", { name: "Save lesson", exact: true }).click();
  await expect(page.getByRole("button", { name: "Save lesson", exact: true })).toBeDisabled();
  expect(state.blocks).toEqual([
    { type: "rich_text", data: { text: "Keep this paragraph" } },
    { type: "quiz", data: { question: "Which remains?", choices: ["Keep", "Correct"], correctIndex: 1 } },
  ]);
});

async function setup(page: Page) {
  const state = await portal(page);
  await page.addInitScript(() => localStorage.setItem("eyf-consent", "denied"));
  return state;
}

test("unsaved lessons survive shared navigation and history, and failed saves retain the draft", async ({ page }) => {
  const state = await setup(page);
  await page.goto(builder);
  await page.getByLabel("Text 1", { exact: true }).fill("A private, unsaved lesson.");
  // Selecting the current lesson must not accidentally clear the exit guard.
  await page.getByRole("button", { name: /Introduction.*1 block/ }).click();
  await page.getByRole("link", { name: "EYF LMS", exact: true }).click();
  const warning = page.getByRole("alertdialog");
  await expect(warning).toContainText("Leave with unsaved changes?");
  await warning.getByRole("button", { name: "Keep editing" }).click();
  await expect(page.getByLabel("Text 1", { exact: true })).toHaveValue("A private, unsaved lesson.");
  await page.getByRole("link", { name: "Back to courses", exact: true }).click();
  await warning.getByRole("button", { name: "Leave lesson" }).click();
  await expect(page).toHaveURL(/org=lms-org&tab=courses/);
  await page.goBack();
  await expect(page.getByText("Your unsaved draft was restored. Review it and save when ready.")).toBeVisible();
  await expect(page.getByLabel("Text 1", { exact: true })).toHaveValue("A private, unsaved lesson.");
  await page.route("**/v1/orgs/lms-org/lessons/lesson-1", (route) => route.fulfill({ status: 503, json: { success: false, error: { code: "UNAVAILABLE", message: "Save unavailable. Try again." } } }));
  await page.getByRole("button", { name: "Save lesson", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Save unavailable" }).first()).toBeVisible();
  await expect(page.getByLabel("Text 1", { exact: true })).toHaveValue("A private, unsaved lesson.");
  await page.unroute("**/v1/orgs/lms-org/lessons/lesson-1");
  await page.getByRole("button", { name: "Save lesson", exact: true }).click();
  await expect(page.getByRole("button", { name: "Save lesson", exact: true })).toBeDisabled();
  expect(state.blocks[0]!.data.text).toBe("A private, unsaved lesson.");
  await page.getByRole("link", { name: "Back to courses", exact: true }).click();
  await expect(page).toHaveURL(/tab=courses/);
  await expect(warning).toHaveCount(0);
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))).not.toContain("A private, unsaved lesson.");
});

test("authors preview unsaved quizzes, undo removal and save the intended correct answer", async ({ page }, info) => {
  const state = await setup(page);
  const mutations: string[] = [];
  page.on("request", (request) => { if (["POST", "PATCH"].includes(request.method()) && request.url().includes("/v1/")) mutations.push(request.url()); });
  await page.goto(builder);
  await page.locator("summary").filter({ hasText: "Add content" }).click();
  await page.getByRole("button", { name: "+ Quiz", exact: true }).click();
  await page.getByLabel("Quiz 2", { exact: true }).fill("Which response contains records?");
  await page.getByLabel("Quiz 2 answer 1", { exact: true }).fill("A keyboard");
  await page.getByLabel("Quiz 2 answer 2", { exact: true }).fill("Data");
  await page.getByRole("radio", { name: "Correct answer 2", exact: true }).check();
  await page.getByRole("button", { name: "Preview lesson", exact: true }).click();
  await expect(page.getByRole("region", { name: "Learner preview" })).toBeVisible();
  await page.getByRole("radio", { name: "Data", exact: true }).check();
  expect(mutations).toEqual([]);
  expect(state.courseStatus).toBe("DRAFT");
  await page.screenshot({ path: info.outputPath("draft-preview-desktop.png"), fullPage: true });
  await page.getByRole("button", { name: "Back to editing", exact: true }).click();
  await page.getByRole("button", { name: "Remove block 2", exact: true }).click();
  await expect(page.getByLabel("Quiz 2", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Undo removal" }).click();
  await expect(page.getByRole("radio", { name: "Correct answer 2", exact: true })).toBeChecked();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const name of ["Move block 2 up", "Remove block 2"]) {
    const box = await page.getByRole("button", { name, exact: true }).boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(44);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: info.outputPath("editor-mobile.png"), fullPage: true });
  await page.getByRole("button", { name: "Save lesson", exact: true }).click();
  await expect(page.getByRole("button", { name: "Save lesson", exact: true })).toBeDisabled();
  expect(state.blocks[1]!.data.correctIndex).toBe(1);
});

test("workspace navigation keeps context, follows visual keyboard order and keeps creation optional", async ({ page }, info) => {
  await setup(page);
  await page.goto("/orgs?org=lms-org&tab=programs");
  await expect(page.getByLabel("Program title", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Invitation code", { exact: true })).toBeHidden();
  await page.getByRole("tab", { name: "Certificates", exact: true }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("tab", { name: "Courses", exact: true })).toBeFocused();
  await expect(page).toHaveURL(/org=lms-org&tab=courses/);
  await expect(page.getByLabel("New course title", { exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("tab", { name: "Courses", exact: true })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("tab", { name: "Cohorts", exact: true }).click();
  await page.getByRole("button", { name: "New cohort", exact: true }).click();
  await expect(page.getByText(/A published program is needed before creating a cohort/)).toBeVisible();
  await page.getByRole("tab", { name: "Programs", exact: true }).click();
  await page.screenshot({ path: info.outputPath("workspace-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel("Workspace section", { exact: true }).selectOption("courses");
  await expect(page.getByRole("heading", { name: "Courses", exact: true })).toBeVisible();
  await page.getByLabel("Search courses", { exact: true }).fill("Nothing here");
  await expect(page.getByText(/No courses match/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("workspace-mobile.png"), fullPage: true });
});

test("role descriptions preview combined permissions and block suspended access", async ({ page }, info) => {
  await setup(page);
  await page.goto("/orgs?org=lms-org&tab=people");
  await page.getByRole("button", { name: "Edit Learner One", exact: true }).click();
  await expect(page.getByText("Cannot publish or enroll learners.", { exact: false })).toBeVisible();
  await page.getByRole("checkbox", { name: "Learning manager", exact: true }).check();
  const summary = page.getByRole("region", { name: "Resulting access", exact: true });
  await summary.locator("summary").click();
  await expect(summary.getByText("Publish learning content", { exact: true })).toBeVisible();
  await page.getByRole("checkbox", { name: "Learning manager", exact: true }).uncheck();
  await expect(summary.getByText("Publish learning content", { exact: true })).toHaveCount(0);
  await page.getByLabel("Access status", { exact: true }).selectOption("SUSPENDED");
  await expect(summary).toContainText("Workspace access will be blocked");
  await expect(summary.locator("summary")).toHaveCount(0);
  await page.getByLabel("Access status", { exact: true }).selectOption("ACTIVE");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: info.outputPath("roles-mobile.png"), fullPage: true });
});

test("course completion directs learners to their next assigned course", async ({ page }, info) => {
  const state = await setup(page); state.role = "MEMBER"; state.courseStatus = "PUBLISHED";
  await page.route("**/v1/orgs/lms-org/work/paths", (route) => route.fulfill({ json: { success: true, data: [{ cohortId: "cohort-1", pathTitle: "Backend induction", courses: [{ id: "course-1", title: state.title, lessonCount: 1, completedCount: 1 }, { id: "course-2", title: "Database foundations", lessonCount: 3, completedCount: 0 }] }] } }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem("eyf-theme", "dark"));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/v1/orgs/lms-org/work/courses/course-2", (route) => route.fulfill({ json: { success: true, data: { id: "course-2", title: "Database foundations", description: "Learn to store records.", lessons: [{ id: "lesson-2", title: "Records and tables", type: "RICH_TEXT", blocks: [{ type: "rich_text", data: { text: "A fresh lesson in the next course." } }], estMinutes: 5, completed: false }] } } }));
  await page.goto("/orgs/lms-org/course/course-1");
  await expect(page.getByRole("heading", { name: "Course complete", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Complete lesson", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Course complete", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue: Database foundations", exact: true })).toHaveAttribute("href", "/orgs/lms-org/course/course-2");
  await expect(page.getByText("Assessments and certificates have separate requirements.", { exact: false })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const progress = page.getByRole("progressbar", { name: "Course progress" });
  await expect(progress).toHaveAttribute("value", "1");
  await expect(progress).toHaveAttribute("max", "1");
  await page.screenshot({ path: info.outputPath("completed-mobile-dark.png"), fullPage: true });
  await page.getByRole("link", { name: "Continue: Database foundations", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Records and tables", exact: true })).toBeVisible();
  await expect(page.getByText("A fresh lesson in the next course.", { exact: true })).toBeVisible();
  await page.goBack();
  await page.getByRole("link", { name: "View Backend induction", exact: true }).click();
  await expect(page).toHaveURL(/org=lms-org&tab=learning/);
});
