import { test, expect } from "@playwright/test";

test.describe("landing page", () => {
  test("renders hero, pricing CTA, and footer", async ({ page }) => {
    await page.goto("/");

    // Hero
    await expect(page.getByRole("heading", { name: /getting placed/i }))
      .toBeVisible();
    await expect(page.getByText(/built for the 95/i)).toBeVisible();

    // Primary CTAs
    await expect(page.getByRole("link", { name: /start your assessment/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /choose your path/i })).toBeVisible();

    // Pillars
    await expect(page.getByText(/from confused to placed/i)).toBeVisible();

    // Footer
    await expect(page.getByText(/india's placement os/i)).toBeVisible();
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
  test("dashboard redirects unauthenticated users to sign-in", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/sign-in/);
  });
});
