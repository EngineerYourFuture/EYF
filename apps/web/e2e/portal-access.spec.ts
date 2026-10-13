import { test, expect } from "@playwright/test";
import { portal } from "./fixtures/lms";

const LMS = process.env.E2E_LMS_URL ?? "http://localhost:3001";

test("public EYF cannot serve private LMS routes, including alternate request forms", async ({ request }) => {
  for (const path of ["/orgs", "/org", "/learn", "/invite/private-token", "/orgs/customer/build/course", "/orgs/customer.json", "/learn/private?_rsc=test"]) {
    const result = await request.get(path, { headers: { "x-eyf-portal": "lms", rsc: "1" } });
    expect(result.status(), path).toBe(404);
    expect(result.headers()["cache-control"]).toContain("no-store");
  }
});

test("LMS has its own entry point, no indexing, and no general or platform admin pages", async ({ request }) => {
  const entry = await request.get(LMS, { maxRedirects: 0 }); expect(entry.status()).toBe(307);
  expect(new URL(entry.headers().location!, LMS).href).toBe(`${LMS}/orgs`);
  for (const path of ["/dashboard", "/admin", "/pricing", "/sprint"]) expect((await request.get(`${LMS}${path}`)).status()).toBe(404);
  const robots = await request.get(`${LMS}/robots.txt`); expect(await robots.text()).toContain("Disallow: /");
  const orgs = await request.get(`${LMS}/orgs`); expect(orgs.headers()["x-robots-tag"]).toContain("noindex");
});

test("learner sees only permitted tools and an explicit access matrix", async ({ page }, info) => {
  const state = await portal(page); state.role = "MEMBER";
  await page.goto(`${LMS}/orgs`);
  await expect(page.getByRole("heading", { name: "My programs", exact: true })).toBeVisible();
  for (const name of ["People and access", "Settings", "Reviews", "Hiring"]) await expect(page.getByRole("tab", { name, exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Create org", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Problems", exact: true })).toHaveCount(0);
  await page.getByRole("tab", { name: "Your access", exact: true }).click();
  await expect(page.getByRole("row", { name: "Publish learning content No access", exact: true })).toBeVisible();
  await expect(page.getByRole("row", { name: "Assessment results Your records", exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath("lms-access-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("lms-access-mobile.png"), fullPage: true });
});

test("HR invitations cannot assign staff roles", async ({ page }) => {
  const state = await portal(page); state.role = "HR";
  await page.goto(`${LMS}/orgs`); await page.getByRole("tab", { name: "People and access", exact: true }).click();
  await page.getByRole("button", { name: "Invite a person", exact: true }).click();
  await expect(page.getByLabel("Invitation role").locator("option")).toHaveText(["Learner", "Intern"]);
});

test("platform administrator provisions a workspace and changes its seat limit", async ({ page }, info) => {
  await portal(page); await page.addInitScript(() => localStorage.setItem("eyf-consent", "denied"));
  await page.route("**/v1/me", (r) => r.fulfill({ json: { success: true, data: { user: { role: "ADMIN" } } } }));
  await page.route("**/v1/admin/gate/status", (r) => r.fulfill({ json: { success: true, data: { required: false, passed: true } } }));
  const orgs: { id: string; name: string; slug: string; seatsLicensed: number; plan: string; _count: { members: number } }[] = [];
  await page.route("**/v1/admin/organizations**", async (r) => {
    if (r.request().method() === "PATCH") orgs[0]!.seatsLicensed = r.request().postDataJSON().seatsLicensed;
    await r.fulfill({ json: { success: true, data: orgs } });
  });
  await page.route("**/v1/orgs", async (r) => { const body = r.request().postDataJSON(); expect(body.ownerEmail).toBe("owner@example.test"); orgs.push({ id: "org-1", name: body.name, slug: "academy", seatsLicensed: body.seatsLicensed, plan: "TRIAL", _count: { members: 1 } }); await r.fulfill({ json: { success: true, data: orgs[0] } }); });
  await page.goto("/admin/organizations");
  await page.getByLabel("Organization name", { exact: true }).fill("Academy"); await page.getByLabel("Owner email").fill("owner@example.test");
  await page.getByRole("button", { name: "Create workspace", exact: true }).click();
  await expect(page.getByText(/Workspace created for owner@example.test/)).toBeVisible();
  await page.getByLabel("Seats for Academy").fill("20"); await page.getByRole("button", { name: "Save seats" }).click();
  await expect(page.getByText("Seat limit updated.")).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: info.outputPath("lms-admin-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("lms-admin-mobile.png"), fullPage: true });
});

test("private invitation links require an explicit acceptance and stay inside LMS", async ({ page }) => {
  await portal(page);
  let accepted = 0;
  await page.route("**/v1/orgs/invites/accept", async (route) => { accepted++; expect(route.request().postDataJSON().token).toBe("invitation-12345"); await route.fulfill({ json: { success: true, data: { orgId: "lms-org" } } }); });
  await page.goto(`${LMS}/invite/invitation-12345`);
  await expect(page.getByRole("heading", { name: "Join your organization" })).toBeVisible(); expect(accepted).toBe(0);
  await page.getByRole("button", { name: "Accept invitation", exact: true }).click();
  await expect(page.getByRole("heading", { name: "You're in!" })).toBeVisible(); expect(accepted).toBe(1);
  await page.getByRole("link", { name: "Go to organization" }).click(); await expect(page).toHaveURL(`${LMS}/orgs`);
});
