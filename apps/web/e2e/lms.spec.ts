import { expect, test } from "@playwright/test";
import { portal } from "./fixtures/lms";
test.use({ baseURL: process.env.E2E_LMS_URL ?? "http://localhost:3001" });


test("instructor publishes, enrolls a cohort, and learner earns a certificate", async ({ page }, info) => {
  const state = await portal(page);
  await page.goto("/orgs/lms-org/build/course-1");
  const consent = page.getByRole("button", { name: "Essential only" });
  if (await consent.isVisible()) await consent.click();
  await page.locator("summary").filter({ hasText: "Add content" }).click();
  await page.getByRole("button", { name: "+ Quiz", exact: true }).click();
  await page.getByLabel("Quiz 2", { exact: true }).fill("What does an API return?");
  await page.getByLabel("Quiz 2 answer 1", { exact: true }).fill("Data");
  await page.getByLabel("Quiz 2 answer 2", { exact: true }).fill("A keyboard");
  await page.getByRole("button", { name: "Save lesson", exact: true }).click();
  await expect(page.getByRole("button", { name: "Save lesson", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.getByText("PUBLISHED", { exact: true })).toBeVisible();
  await page.goto("/orgs");
  await page.getByRole("button", { name: "New program", exact: true }).click();
  await page.getByLabel("Program title", { exact: true }).fill("Backend induction");
  await page.getByRole("button", { name: "Create program", exact: true }).click();
  await page.getByRole("combobox", { name: "Published course", exact: true }).selectOption("course-1");
  await page.getByRole("button", { name: "Add course", exact: true }).click();
  await page.getByRole("button", { name: "Publish program", exact: true }).click();
  await page.getByRole("tab", { name: "Cohorts", exact: true }).click();
  await page.getByRole("button", { name: "New cohort", exact: true }).click();
  await page.getByRole("combobox", { name: "Published program", exact: true }).selectOption("path-1");
  await page.getByLabel("Cohort name", { exact: true }).fill("October cohort");
  await page.getByRole("button", { name: "Create cohort", exact: true }).click();
  await page.getByRole("checkbox", { name: /Learner One/ }).check();
  await page.getByRole("button", { name: "Enroll selected learners", exact: true }).click();
  await expect(page.getByText("Learners enrolled.", { exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath("programs-desktop.png"), fullPage: true });
  await page.getByRole("tab", { name: "People and access", exact: true }).click();
  await page.getByRole("button", { name: "Invite a person", exact: true }).click();
  await page.getByLabel("Email", { exact: true }).fill("learner@example.test");
  await page.getByRole("button", { name: "Create invitation", exact: true }).click();
  await expect(page.getByLabel("Invitation code", { exact: true }).last()).toHaveValue("demo-invitation-code-12345");
  await page.getByRole("tab", { name: "Certificates", exact: true }).click();
  await page.getByLabel("Certificate title").fill("Backend graduate");
  await page.getByRole("combobox", { name: "Qualifying assessment", exact: true }).selectOption("blueprint-1");
  await page.getByRole("button", { name: "Create certificate template" }).click();
  await expect(page.getByText("Certificate template created.")).toBeVisible();
  state.role = "MEMBER";
  await page.goto("/orgs/lms-org/course/course-1");
  await page.getByRole("button", { name: "Complete lesson", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Answer question 1 correctly" })).toBeVisible();
  await page.getByRole("radio", { name: "Data", exact: true }).check();
  await page.getByRole("button", { name: "Complete lesson", exact: true }).click();
  await expect(page.getByRole("button", { name: "Completed", exact: true })).toBeDisabled();
  await page.goto("/orgs");
  await page.getByRole("tab", { name: "Assessments", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Assessment blueprints" })).toHaveCount(0);
  await page.getByRole("button", { name: "Start assessment" }).click();
  await page.getByRole("radio", { name: "Database", exact: true }).check();
  await page.getByRole("button", { name: "Submit assessment" }).click();
  await expect(page.getByText("Assessment passed — 100%", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Certificates", exact: true }).click();
  await expect(page.getByRole("link", { name: "View and verify certificate" })).toHaveAttribute("href", "/verify/verify-lms");
});

test("mobile learner renders supported lesson blocks without overflow", async ({ page }, info) => {
  const state = await portal(page); state.role = "MEMBER"; state.courseStatus = "PUBLISHED";
  state.blocks = [
    { type: "heading", data: { text: "Backend introduction" } },
    { type: "video", data: { url: "https://youtu.be/dQw4w9WgXcQ", title: "Welcome video" } },
    { type: "toggle", data: { title: "Read an example", text: "An example response." } },
    { type: "file", data: { title: "Lesson handout", url: "https://example.com/handout.pdf" } },
    { type: "quiz", data: { question: "Choose the response", choices: ["Data", "Keyboard"], correctIndex: 0 } },
  ];
  await page.addInitScript(() => localStorage.setItem("eyf-theme", "dark"));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/orgs/lms-org/course/course-1");
  const consent = page.getByRole("button", { name: "Essential only" });
  if (await consent.isVisible()) await consent.click();
  await expect(page.locator('iframe[title="Welcome video"]')).toBeVisible();
  await page.getByText("Read an example", { exact: true }).click();
  await expect(page.getByText("An example response.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Lesson handout (new tab)" })).toHaveAttribute("href", "https://example.com/handout.pdf");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("learner-mobile.png"), fullPage: true });
});

test("course errors offer recovery instead of a permanent skeleton", async ({ page }) => {
  await portal(page);
  await page.route("**/v1/orgs/lms-org/work/courses/course-1", (route) => route.fulfill({ status: 404, json: { success: false, error: { code: "NOT_FOUND", message: "Not found" } } }));
  await page.goto("/orgs/lms-org/course/course-1");
  await expect(page.getByText("We couldn't load this information. Try again.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to my programs" })).toBeVisible();
});
