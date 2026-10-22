import { test, expect } from "@playwright/test";
import { portal } from "./fixtures/lms";

// Value: protects=when /me reports no AI or transcription provider, drills and AI mocks say so up front and their AI actions can't be started;
// fails_when=AiUnavailable or the caps checks are dropped, inverted, or read the wrong /me field, so learners write answers that fail at submit;
// why_new=no spec renders /communication or /mocks with capabilities; seam=none;
// no_claim=the API's real capability detection (/me mocked); recording itself is not exercised
test("AI-backed practice is disabled with a notice when the server has no AI providers", async ({ page }) => {
  await portal(page);
  await page.addInitScript(() => localStorage.setItem("eyf-consent", "denied"));
  let capabilities = { ai: false, transcription: false };
  await page.route("**/v1/me", (r) => r.fulfill({ json: { success: true, data: { user: { id: "lms-user", name: "Learner", role: "STUDENT_FREE", subscription: { plan: "FREE" } }, capabilities } } }));
  await page.route("**/v1/communication/prompts", (r) => r.fulfill({ json: { success: true, data: {
    kinds: [{ id: "INTRO", name: "Introduction", blurb: "Open strong." }],
    prompts: [{ id: "p-1", kind: "INTRO", question: "Tell me about yourself.", tip: "Lead with a project." }],
  } } }));
  await page.route("**/v1/mocks/me", (r) => r.fulfill({ json: { success: true, data: [] } }));

  await page.goto("/communication");
  await page.getByRole("button", { name: /Tell me about yourself/ }).click();
  await expect(page.getByRole("status").filter({ hasText: "AI coaching isn’t set up on this server yet" })).toBeVisible();
  await page.getByLabel("Your answer").fill("I build backend services and test them well.");
  await expect(page.getByRole("button", { name: "Get feedback" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Record" })).toHaveCount(0);

  await page.goto("/mocks");
  await expect(page.getByRole("status").filter({ hasText: "The AI interviewer isn’t set up on this server yet" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start AI mock" })).toBeDisabled();
});

// Value: protects=each capability flag gates only its own control once /me has loaded;
// fails_when=the transcription and AI checks are swapped or both read one flag; why_new=the test above sets both
// flags together; seam=none; no_claim=the API's real capability detection (/me mocked)
test("each capability flag gates only its own control", async ({ page }) => {
  await portal(page);
  await page.addInitScript(() => localStorage.setItem("eyf-consent", "denied"));
  let capabilities = { ai: true, transcription: true };
  await page.route("**/v1/me", (r) => r.fulfill({ json: { success: true, data: { user: { id: "lms-user", name: "Learner", role: "STUDENT_FREE", subscription: { plan: "FREE" } }, capabilities } } }));
  await page.route("**/v1/communication/prompts", (r) => r.fulfill({ json: { success: true, data: {
    kinds: [{ id: "INTRO", name: "Introduction", blurb: "Open strong." }],
    prompts: [{ id: "p-1", kind: "INTRO", question: "Tell me about yourself.", tip: "Lead with a project." }],
  } } }));
  await page.route("**/v1/mocks/me", (r) => r.fulfill({ json: { success: true, data: [] } }));

  const load = async (url: string, caps: typeof capabilities) => {
    capabilities = caps;
    const me = page.waitForResponse("**/v1/me");
    await page.goto(url);
    await me;
  };
  const answer = async () => {
    await page.getByRole("button", { name: /Tell me about yourself/ }).click();
    await page.getByLabel("Your answer").fill("I build backend services and test them well.");
  };
  await load("/mocks", { ai: true, transcription: true });
  await expect(page.getByRole("button", { name: "Start AI mock" })).toBeEnabled();
  await expect(page.getByRole("status").filter({ hasText: "AI interviewer" })).toHaveCount(0);
  await load("/communication", { ai: true, transcription: false });
  await answer();
  await expect(page.getByRole("button", { name: "Get feedback" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Record" })).toHaveCount(0);
  await expect(page.getByRole("status").filter({ hasText: "AI coaching" })).toHaveCount(0);
  await load("/communication", { ai: false, transcription: true });
  await answer();
  await expect(page.getByRole("button", { name: "Get feedback" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Record" })).toBeVisible();
});
