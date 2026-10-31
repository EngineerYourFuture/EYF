import { test, expect } from "@playwright/test";
import { portal } from "./fixtures/lms";

// Value: protects=double-clicking "New resume" creates exactly one resume and opens it;
// fails_when=the in-flight guard or the disabled state is removed, so each click POSTs a blank resume;
// why_new=resume.integration.test covers the API route only, no spec drives the create button; seam=none;
// no_claim=server-side idempotency (API mocked; the guard is client-side)
test("double-clicking New resume creates one resume", async ({ page }) => {
  await portal(page);
  await page.addInitScript(() => localStorage.setItem("eyf-consent", "denied"));
  let posts = 0;
  await page.route("**/v1/resume/me", (r) => r.fulfill({ json: { success: true, data: [] } }));
  await page.route("**/v1/resume", async (r) => {
    posts += 1;
    await new Promise((done) => setTimeout(done, 300));
    await r.fulfill({ json: { success: true, data: { id: "resume-1", title: "My Resume", template: "classic", atsScore: null, updatedAt: "2026-10-22T08:00:00Z" } } });
  });
  await page.goto("/resume");
  await page.getByRole("button", { name: "New resume", exact: true }).dblclick();
  // Full navigation to the editor; a cold dev compile can take longer than the default 5s.
  await expect(page).toHaveURL(/\/resume\/resume-1$/, { timeout: 15_000 });
  expect(posts).toBe(1);
});

const resume = { id: "r1", title: "Primary", template: "classic", atsScore: null, atsBreakdown: null, json: { contact: { name: "A", email: "" }, summary: "", skills: [], experience: [], projects: [], education: [] } };

// Value: protects=a refresh that fails after a successful Save keeps the editor on screen instead of swapping it for the load error;
// fails_when=the editor goes back to rendering LoadError on any error (drops the `&& !data` guard), so a background refetch failure wipes the page;
// why_new=no spec opens /resume/<id>; the double-click spec only covers create; seam=none; no_claim=server-side save and rescoring (API mocked)
test("a failed refresh after save keeps the resume editor", async ({ page }) => {
  await portal(page);
  await page.addInitScript(() => localStorage.setItem("eyf-consent", "denied"));
  const errors: Error[] = [];
  page.on("pageerror", (e) => errors.push(e));
  let fail = false;
  await page.route("**/v1/resume/r1", (r) => r.request().method() === "PATCH"
    ? r.fulfill({ json: { success: true, data: { atsScore: 40 } } })
    : r.fulfill(fail ? { status: 503, json: { success: false, error: { code: "UNAVAILABLE", message: "Unavailable" } } } : { json: { success: true, data: resume } }));
  await page.goto("/resume/r1");
  await expect(page.getByRole("heading", { name: "Primary" })).toBeVisible();
  fail = true;
  const refresh = page.waitForResponse((r) => r.url().endsWith("/v1/resume/r1") && r.request().method() === "GET" && r.status() === 503);
  await page.getByRole("button", { name: "Save resume" }).click();
  await expect(page.getByText("Saved · ATS 40/100")).toBeVisible();
  await refresh;
  // Save re-enables only after its refetch settles, so the checks below see the post-refresh render.
  await expect(page.getByRole("button", { name: "Save resume" })).toBeEnabled();
  await expect(page.getByRole("heading", { name: "Primary" })).toBeVisible();
  await expect(page.getByText("We couldn’t load this resume", { exact: false })).toHaveCount(0);
  expect(errors).toEqual([]);
});

// Value: protects=a resume that is gone or forbidden when the editor refreshes replaces the cached editor, so revoked access ends;
// fails_when=loadFailed keeps stale data for 403/404 (any error with cached data hides the error state);
// why_new=the refresh spec above covers only a transient 5xx; seam=none; no_claim=server-side authorization (API mocked)
test("a refresh that finds the resume gone replaces the editor", async ({ page }) => {
  await portal(page);
  await page.addInitScript(() => localStorage.setItem("eyf-consent", "denied"));
  let gone = false;
  await page.route("**/v1/resume/r1", (r) => r.request().method() === "PATCH"
    ? r.fulfill({ json: { success: true, data: { atsScore: 40 } } })
    : r.fulfill(gone ? { status: 404, json: { success: false, error: { code: "NOT_FOUND", message: "Not found" } } } : { json: { success: true, data: resume } }));
  await page.goto("/resume/r1");
  await expect(page.getByRole("heading", { name: "Primary" })).toBeVisible();
  gone = true;
  await page.getByRole("button", { name: "Save resume" }).click();
  await expect(page.getByRole("heading", { name: "This resume isn’t available" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Primary" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "All resumes" })).toHaveAttribute("href", "/resume");
});
