import { expect, test, type Page } from "@playwright/test";
import { portal } from "./fixtures/lms";

const LMS = process.env.E2E_LMS_URL ?? "http://localhost:3001";

async function openPortal(page: Page, mobile = false) {
  await portal(page);
  await page.addInitScript(() => localStorage.setItem("eyf-consent", "denied"));
  if (mobile) await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/labs");
  await expect(page.getByRole("button", { name: mobile ? "Open menu" : /Search…/, exact: mobile })).toBeVisible();
}

test("search contains keyboard focus and remains usable when its transition reverses", async ({ page }) => {
  await openPortal(page);
  const trigger = page.getByRole("button", { name: /Search…/ });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Search EYF" });
  const search = dialog.getByRole("combobox");
  await expect(search).toBeFocused();
  expect(await dialog.evaluate((element) => element.matches(":modal"))).toBe(true);
  await search.fill("Practical Labs");
  await expect(dialog.getByRole("option")).toHaveCount(1);
  await expect(search).toHaveAttribute("aria-activedescendant", "command-result-0");
  await search.press("Tab");
  await expect(dialog.getByRole("button", { name: "Close search" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(search).toBeFocused();
  await page.keyboard.press("Control+k");
  await page.keyboard.press("Control+k");
  await expect(search).toBeVisible();
  await search.fill("Practical Labs");
  await search.press("Enter");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
});

test("mobile menus restore the actual opener and nested search keeps the page locked", async ({ page }, info) => {
  await openPortal(page, true);
  const opener = page.getByRole("button", { name: "Open full menu" });
  await opener.click();
  const drawer = page.getByRole("dialog", { name: "Navigation menu" });
  await expect(drawer.getByRole("button", { name: "Close menu" })).toBeFocused();
  await drawer.getByRole("button", { name: /Search…/ }).click();
  await expect(page.getByRole("dialog", { name: "Search EYF" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Search EYF" })).toHaveCount(0);
  await expect(drawer.getByRole("button", { name: /Search…/ })).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
  await page.screenshot({ path: info.outputPath("mobile-navigation.png") });
  await page.keyboard.press("Escape");
  await expect(drawer).toHaveCount(0);
  await expect(opener).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
  await opener.click();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(drawer).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
});

test("motion, transparency and contrast preferences keep overlays readable", async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: "reduce", contrast: "more" });
  await openPortal(page, true);
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  const panel = page.getByRole("dialog", { name: "Navigation menu" }).locator(".eyf-dialog-panel");
  await expect(panel).toHaveCSS("transform", "none");
  await expect(panel).toHaveCSS("backdrop-filter", "none");
  expect(await panel.evaluate((el) => getComputedStyle(el).backgroundColor)).toMatch(/^rgb\(/);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Navigation menu" })).toHaveCount(0);

  // Chromium exposes reduced transparency through CDP before Playwright's API.
  const session = await page.context().newCDPSession(page);
  await session.send("Emulation.setEmulatedMedia", { features: [
    { name: "prefers-reduced-transparency", value: "reduce" },
    { name: "prefers-reduced-motion", value: "reduce" },
    { name: "prefers-contrast", value: "no-preference" },
  ] });
  await page.getByRole("button", { name: "Search", exact: true }).click();
  const search = page.getByRole("dialog", { name: "Search EYF" });
  await expect(search.locator(".eyf-dialog-panel")).toHaveCSS("backdrop-filter", "none");
  expect(await search.locator(".eyf-dialog-panel").evaluate((el) => getComputedStyle(el).backgroundColor)).toMatch(/^rgb\(/);
  await expect(search.locator(".eyf-dialog-panel")).toHaveCSS("opacity", "1");
  await page.screenshot({ path: info.outputPath("accessible-search.png") });
});

test("confirmation cancels safely and lesson contents stay usable on a narrow screen", async ({ page }, info) => {
  const state = await portal(page);
  state.invited = true;
  await page.addInitScript(() => localStorage.setItem("eyf-consent", "denied"));
  await page.goto(`${LMS}/orgs`);
  await page.getByRole("tab", { name: "People and access", exact: true }).click();
  await page.getByRole("button", { name: "Invite a person", exact: true }).click();
  const revoke = page.getByRole("button", { name: "Revoke", exact: true });
  await revoke.click();
  const confirmation = page.getByRole("alertdialog");
  await expect(confirmation.getByRole("button", { name: "Cancel" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(confirmation).toHaveCount(0);
  await expect(revoke).toBeFocused();
  await page.screenshot({ path: info.outputPath("people-desktop.png") });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${LMS}/orgs/lms-org/course/course-1`);
  const contents = page.getByRole("button", { name: /Course contents/ });
  await expect(contents).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("navigation", { name: "Lessons" })).toBeHidden();
  await contents.click();
  await expect(page.getByRole("navigation", { name: "Lessons" })).toBeVisible();
  await page.getByRole("navigation", { name: "Lessons" }).getByRole("button", { name: "Introduction" }).click();
  await expect(contents).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("heading", { name: "Introduction", exact: true })).toBeFocused();
  await page.screenshot({ path: info.outputPath("lesson-mobile.png"), fullPage: true });
  // Enlarged user text must not clip the lesson action or introduce page overflow.
  await page.evaluate(() => { document.documentElement.style.fontSize = "24px"; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole("button", { name: "Complete lesson", exact: true })).toBeVisible();
});
