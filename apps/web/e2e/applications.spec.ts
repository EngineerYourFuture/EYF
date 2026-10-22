import { test, expect, type Page } from "@playwright/test";
import { portal } from "./fixtures/lms";

const job = { id: "job-1", slug: "acme-sde", company: "Acme", title: "SDE intern", role: "SDE", location: "Pune", remote: false, salaryMinInr: null, salaryMaxInr: null, experienceMin: 0, description: "Build services.", applyUrl: "https://example.test/apply", postedAt: "2026-10-01T00:00:00Z", closesAt: null };
const unavailable = (status: number) => ({ status, json: { success: false, error: { code: status === 404 ? "NOT_FOUND" : "UNAVAILABLE", message: "Unavailable" } } });

async function learner(page: Page) {
  await portal(page);
  await page.addInitScript(() => localStorage.setItem("eyf-consent", "denied"));
  const errors: Error[] = [];
  page.on("pageerror", (e) => errors.push(e));
  return errors;
}

// Value: protects=a missing job says so with no retry, while a server failure says "couldn’t load" and offers Try again;
// fails_when=LoadError stops branching on status (404 gets a useless retry, or 5xx loses it) or the job page drops LoadError;
// why_new=no spec loads /jobs/<slug>; LoadError has no unit test; seam=none; no_claim=real API status codes (API mocked)
test("job page words load errors by status and only offers retry when it can help", async ({ page }) => {
  await learner(page);
  let status = 404;
  await page.route("**/v1/jobs/acme-sde", (r) => r.fulfill(status === 200 ? { json: { success: true, data: job } } : unavailable(status)));
  await page.goto("/jobs/acme-sde");
  await expect(page.getByRole("heading", { name: "This job isn’t available" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toHaveCount(0);

  status = 503;
  await page.goto("/jobs/acme-sde");
  await expect(page.getByText("We couldn’t load this job. Check your connection and try again.")).toBeVisible();
  status = 200;
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("heading", { name: "SDE intern" })).toBeVisible();
});

// Value: protects=the job page names the tracked stage in words (Saved / In tracker · Rejected) instead of a raw enum or a re-save button;
// fails_when=every tracked status shows "Saved" again, the label falls back to the raw enum (REJECTED), or the SAVED branch is lost;
// why_new=no spec renders a tracked job;
// seam=none; no_claim=tracker data shape from the API (mocked applications list)
test("job page shows the tracked stage in words", async ({ page }) => {
  await learner(page);
  let stage = "REJECTED";
  await page.route("**/v1/jobs/acme-sde", (r) => r.fulfill({ json: { success: true, data: job } }));
  await page.route("**/v1/jobs/me/applications", (r) => r.fulfill({ json: { success: true, data: [{ id: "app-1", status: stage, job: { slug: "acme-sde" } }] } }));
  await page.goto("/jobs/acme-sde");
  await expect(page.getByRole("button", { name: "In tracker · Rejected", exact: true })).toBeDisabled();
  stage = "SAVED";
  await page.reload();
  await expect(page.getByRole("button", { name: "✓ Saved", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Save to tracker" })).toHaveCount(0);
});

// Value: protects=a failed reject leaves the card in its column, tells the learner, and opens no comeback plan;
// fails_when=reject opens the plan regardless of the PATCH result, or the PATCH goes back to silent: true (no toast);
// why_new=no spec drives /pipeline; seam=none; no_claim=comeback plan contents (readiness mocked as null)
test("a failed reject keeps the card and opens no comeback plan", async ({ page }) => {
  const errors = await learner(page);
  const patches: unknown[] = [];
  await page.route("**/v1/jobs/me/applications", (r) => r.fulfill({ json: { success: true, data: [{ id: "app-1", status: "OA", notes: null, appliedAt: null, job }] } }));
  await page.route("**/v1/jobs/me/applications/app-1", (r) => { patches.push(r.request().postDataJSON()); return r.fulfill(unavailable(503)); });
  await page.goto("/pipeline");
  await expect(page.getByText("SDE intern")).toBeVisible();
  await page.getByTitle("Mark closed").click();
  await expect(page.getByText("Something went wrong on our end. Try again.")).toBeVisible();
  expect(patches).toEqual([{ status: "REJECTED" }]);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("Comeback plan")).toHaveCount(0);
  await expect(page.getByText("SDE intern")).toBeVisible();
  expect(errors).toEqual([]);
});

// Value: protects=a reject the server accepts opens the comeback plan for that application;
// fails_when=setStatus stops returning true on success or reject's guard is inverted, so the plan never opens after a real rejection;
// why_new=the failed-reject spec only proves the plan stays shut; seam=none; no_claim=comeback plan contents (readiness mocked as null)
test("a successful reject opens the comeback plan", async ({ page }) => {
  const errors = await learner(page);
  const patches: unknown[] = [];
  await page.route("**/v1/jobs/me/applications", (r) => r.fulfill({ json: { success: true, data: [{ id: "app-1", status: "OA", notes: null, appliedAt: null, job }] } }));
  await page.route("**/v1/jobs/me/applications/app-1", (r) => { patches.push(r.request().postDataJSON()); return r.fulfill({ json: { success: true, data: { id: "app-1", status: "REJECTED" } } }); });
  await page.goto("/pipeline");
  await page.getByTitle("Mark closed").click();
  await expect(page.getByRole("dialog", { name: "SDE intern · Acme" })).toBeVisible();
  expect(patches).toEqual([{ status: "REJECTED" }]);
  expect(errors).toEqual([]);
});

// Value: protects=a failed Save on the jobs list shows an error toast and raises no uncaught error;
// fails_when=save() rethrows into the click handler (unhandled rejection) or the toast is silenced again;
// why_new=no spec drives /jobs saving; seam=none; no_claim=server-side save behaviour (API mocked)
test("a failed save on the jobs list is reported, not thrown", async ({ page }) => {
  const errors = await learner(page);
  await page.route("**/v1/jobs", (r) => r.fulfill({ json: { success: true, data: [job] } }));
  await page.route("**/v1/jobs/acme-sde/save", (r) => r.fulfill(unavailable(500)));
  await page.goto("/jobs");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Something went wrong on our end. Try again.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save", exact: true })).toBeEnabled();
  await expect(page).toHaveURL(/\/jobs$/);
  expect(errors).toEqual([]);
});
