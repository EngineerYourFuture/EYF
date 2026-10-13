import { expect, test, type Page } from "@playwright/test";

// Next's dev server compiles destination routes on the first navigation in CI.
test.setTimeout(45_000);

const plans = [
  { id: "free", name: "Free", priceInr: 0, annualInr: 0, features: ["5 submissions/day", "OS theory only"] },
  { id: "basic", name: "Basic", priceInr: 249, annualInr: 1999, features: ["All core subjects", "Peer mock interviews"] },
  { id: "pro", name: "Pro", priceInr: 499, annualInr: 3999, features: ["AI mock interviews", "Resume ATS"] },
  { id: "elite", name: "Elite", priceInr: 899, annualInr: 7199, features: ["Everything in Pro", "Mentor priority"] },
];

async function previewApi(page: Page, options: { statusError?: boolean; admin?: boolean; theme?: string } = {}) {
  const writes: { url: string; body: Record<string, unknown> }[] = [];
  const token = `preview.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.test`;
  await page.addInitScript(({ token, theme }) => {
    localStorage.setItem("eyf_dev_token", token);
    localStorage.setItem("eyf_dev_userid", "preview-student");
    localStorage.setItem("eyf-theme", theme);
  }, { token, theme: options.theme ?? "dark" });
  await page.route("**/v1/**", async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace(/^\/v1/, "");
    if (req.method() === "POST") writes.push({ url: path, body: req.postDataJSON() });
    if (options.statusError && path === "/billing/status") {
      return route.fulfill({ status: 503, json: { success: false, error: { code: "UNAVAILABLE", message: "Service unavailable" } } });
    }
    let data: unknown = null;
    if (path === "/billing/status") data = { enabled: false };
    if (path === "/billing/plans") data = plans;
    if (path === "/me") data = { user: { id: "preview-student", name: "Preview student", role: options.admin ? "ADMIN" : "STUDENT_FREE", subscription: { plan: "FREE" } } };
    if (path === "/roadmap/today") data = { challenge: null, streak: 0, xpToday: 0, problemsSolvedToday: 0 };
    if (path.endsWith("/flashcards/due") || path === "/jobs/me/applications") data = [];
    if (path === "/admin/gate/status") data = { required: false, passed: true };
    if (path === "/admin/content/problems") {
      data = req.method() === "POST" ? { id: "preview-problem", ...req.postDataJSON() } : [];
    }
    return route.fulfill({ json: { success: true, data } });
  });
  return writes;
}

for (const viewport of [{ name: "desktop", width: 1440, height: 1000 }, { name: "mobile", width: 390, height: 844 }]) {
  for (const theme of ["dark", "light"]) {
    test(`${viewport.name} ${theme}: continue from payment placeholder without checkout`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport);
      const writes = await previewApi(page, { theme });
      const paymentRequests: string[] = [];
      page.on("request", (req) => { if (/razorpay|billing\/(create-order|confirm)/.test(req.url())) paymentRequests.push(req.url()); });
      await page.goto("/billing");
      await expect(page.getByRole("heading", { name: "Continue without payment" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Elite", exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Annual", exact: true }).click();
      await expect(page.getByText("₹3,999", { exact: false })).toBeVisible();
      const consent = page.getByRole("button", { name: "Essential only" });
      if (await consent.isVisible()) await consent.click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`billing-${viewport.name}-${theme}.png`), fullPage: true });
      await page.getByRole("link", { name: "Continue to my daily plan", exact: true }).click();
      await expect(page).toHaveURL(/\/today$/, { timeout: 15_000 });
      await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible();
      expect(paymentRequests).toEqual([]);
      expect(writes).toEqual([]);
    });
  }
}

test("billing service errors still offer a way to continue", async ({ page }) => {
  await previewApi(page, { statusError: true });
  await page.goto("/billing");
  await expect(page.getByText("We couldn't check plan availability. Retry, or continue to your daily plan.")).toBeVisible();
  await page.getByRole("link", { name: "Continue to my daily plan", exact: true }).click();
  await expect(page).toHaveURL(/\/today$/, { timeout: 15_000 });
});

test("public pricing identifies planned prices and links to preview access", async ({ page }) => {
  await previewApi(page);
  await page.goto("/pricing");
  await page.getByRole("link", { name: "Continue without payment", exact: true }).click();
  await expect(page).toHaveURL(/\/billing$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Continue without payment" })).toBeVisible();
});

test("staff can author a public example and a hidden test", async ({ page }, testInfo) => {
  const writes = await previewApi(page, { admin: true });
  await page.goto("/admin/content/problems");
  await page.getByRole("button", { name: "New problem" }).click();
  await page.getByPlaceholder("Two Sum", { exact: true }).fill("Add two integers");
  await page.getByPlaceholder("two-sum", { exact: true }).fill("add-two-integers");
  await page.getByPlaceholder("Problem statement…").fill("Read two integers and print their sum.");
  const save = page.getByRole("button", { name: "Create problem", exact: true });
  await expect(save).toBeDisabled();
  await page.getByLabel("Input 1", { exact: true }).fill("2 3");
  await page.getByLabel("Expected output 1", { exact: true }).fill("5");
  await page.getByLabel("Input 2", { exact: true }).fill("-2 2");
  await page.getByLabel("Expected output 2", { exact: true }).fill("0");
  await expect(save).toBeEnabled();
  await page.screenshot({ path: testInfo.outputPath("problem-tests-editor.png"), fullPage: true });
  await save.click();
  await expect(page.getByRole("button", { name: "New problem" })).toBeVisible();
  expect(writes).toHaveLength(1);
  expect(writes[0]?.body.testCases).toEqual([
    { input: "2 3", expected: "5", isPublic: true },
    { input: "-2 2", expected: "0", isPublic: false },
  ]);
});
