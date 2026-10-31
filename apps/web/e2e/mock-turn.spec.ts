import { test, expect } from "@playwright/test";
import { portal } from "./fixtures/lms";

const mock = { id: "m1", type: "AI", status: "IN_PROGRESS", company: "Acme", problemFocus: "Arrays", feedback: null,
  transcript: [{ role: "assistant", content: "Walk me through two-sum.", ts: 1 }] };

// Value: protects=a mock-interview answer survives a failed send so the learner can retry it;
// fails_when=the composer clears its draft whenever onSend resolves, including after a toasted failure;
// why_new=no spec drives the mock interview composer; seam=none; no_claim=AI turn content (API mocked)
test("a failed interview turn keeps the typed answer", async ({ page }) => {
  await portal(page);
  await page.addInitScript(() => localStorage.setItem("eyf-consent", "denied"));
  const errors: Error[] = [];
  page.on("pageerror", (e) => errors.push(e));
  await page.route("**/v1/mocks/m1", (r) => r.fulfill({ json: { success: true, data: mock } }));
  await page.route("**/v1/mocks/m1/turn", (r) => r.fulfill({ status: 503, json: { success: false, error: { code: "AI_UNAVAILABLE", message: "The AI interviewer is busy. Try again." } } }));
  await page.goto("/mocks/m1");
  const box = page.getByRole("textbox", { name: "Your message" });
  await box.fill("Use a hash map from value to index.");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByText("The AI interviewer is busy. Try again.")).toBeVisible();
  await expect(box).toHaveValue("Use a hash map from value to index.");
  expect(errors).toEqual([]);
});

// Value: protects=a mock interview that can't be opened says so with a way back instead of loading forever;
// fails_when=the page drops its error branch, so a 404 leaves "Loading…" on screen;
// why_new=the LoadError specs cover resume and job pages only; seam=none; no_claim=which mocks the API hides
test("a missing mock interview offers the way back", async ({ page }) => {
  await portal(page);
  await page.addInitScript(() => localStorage.setItem("eyf-consent", "denied"));
  await page.route("**/v1/mocks/m1", (r) => r.fulfill({ status: 404, json: { success: false, error: { code: "NOT_FOUND", message: "Mock not found" } } }));
  await page.goto("/mocks/m1");
  await expect(page.getByRole("heading", { level: 1, name: "This mock interview isn’t available" })).toBeVisible();
  await expect(page.getByRole("link", { name: "All mocks" })).toHaveAttribute("href", "/mocks");
});
