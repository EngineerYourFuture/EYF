import { test, expect } from "@playwright/test";

test.describe("landing page", () => {
  test("renders nav, brand, and primary CTA", async ({ page }) => {
    await page.goto("/");

    // Fixed nav is always visible (hero copy is scroll-animated, so we assert
    // the stable above-the-fold chrome instead).
    await expect(page.getByRole("link", { name: "EYF" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Pricing" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Tracks" }).first()).toBeVisible();

    // Primary CTA into the app. It's a styled <Link> to /sign-up (role "link",
    // not "button") — navigation is the correct semantics for a nav CTA.
    await expect(page.getByRole("link", { name: /start free/i }).first()).toBeVisible();
  });

  test("nav links to pricing", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Pricing" }).first().click();
    await expect(page).toHaveURL(/\/pricing/);
    await expect(page.getByRole("heading", { name: /pay what a textbook costs/i })).toBeVisible();
  });

  test("pricing page renders all 4 plan tiers", async ({ page }) => {
    await page.goto("/pricing");
    for (const plan of ["Free", "Basic", "Pro", "Elite"]) {
      await expect(page.getByRole("heading", { name: plan, exact: true })).toBeVisible();
    }
  });
});

test.describe("auth gating", () => {
  // In dev (placeholder Clerk keys) the auth shim auto-logs-in, so there is no
  // redirect to assert. This only exercises real behaviour with real Clerk keys.
  test.skip(!process.env.E2E_REAL_AUTH, "auth gating requires real Clerk keys (set E2E_REAL_AUTH)");
  test("dashboard redirects unauthenticated users to sign-in", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/sign-in/);
  });
});
