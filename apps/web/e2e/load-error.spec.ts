import { test, expect } from "@playwright/test";
import { portal } from "./fixtures/lms";

const cases = [
  { status: 403, code: "FORBIDDEN", message: "Forbidden", title: "You don’t have access", body: "Your account can’t open this resume." },
  { status: 402, code: "PLAN_REQUIRED", message: "Upgrade to Pro to keep more than one resume.", title: "Not included in your plan", body: "Upgrade to Pro to keep more than one resume." },
];

for (const c of cases) {
  // Value: protects=a resume the learner can't open (403) or isn't on the plan for (402) says why, offers no retry, and links back to All resumes;
  // fails_when=LoadError stops branching on 403/402 (falls through to "couldn’t load" + Try again), drops the 402 server message, or the back link goes;
  // why_new=the job-page spec covers 404 and 5xx only; nothing renders LoadError's 403/402 branches; seam=none; no_claim=which API routes return 402/403 (API mocked)
  test(`a ${c.status} on a resume says why and offers the way back, not a retry`, async ({ page }) => {
    await portal(page);
    await page.addInitScript(() => localStorage.setItem("eyf-consent", "denied"));
    await page.route("**/v1/resume/r1", (r) => r.fulfill({ status: c.status, json: { success: false, error: { code: c.code, message: c.message } } }));
    await page.goto("/resume/r1");
    await expect(page.getByRole("heading", { name: c.title })).toBeVisible();
    await expect(page.getByText(c.body)).toBeVisible();
    await expect(page.getByRole("button", { name: "Try again" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "All resumes" })).toHaveAttribute("href", "/resume");
  });
}
