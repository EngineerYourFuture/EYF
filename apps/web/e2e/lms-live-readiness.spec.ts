import { expect, test } from "@playwright/test";
import { portal } from "./fixtures/lms";

test.use({ baseURL: process.env.E2E_LMS_URL ?? "http://localhost:3001" });
const assetId = "a40d62b9-53eb-4e84-a54c-a0144d6b9e51";

test("author uploads a private lesson file, saves its reference and previews an expiring link", async ({ page }) => {
  const state = await portal(page);
  state.blocks = [{ type: "file", data: { url: "https://example.test/old.pdf", title: "Private worksheet" } }];
  await page.route("**/v1/orgs/lms-org/media", async (route) => {
    expect(route.request().headers()["content-type"]).toContain("multipart/form-data; boundary=");
    expect(route.request().postData()).toContain("private worksheet bytes");
    return route.fulfill({ status: 201, json: { success: true, data: { id: assetId, filename: "worksheet.txt" } } });
  });
  await page.route(`**/v1/orgs/lms-org/media/${assetId}/access`, (route) => route.fulfill({ json: { success: true, data: { path: `/orgs/lms-org/media/${assetId}/content?ticket=temporary-fixture`, filename: "worksheet.txt", contentType: "text/plain" } } }));
  await page.goto("/orgs/lms-org/build/course-1");
  await page.getByLabel("Upload a private file").setInputFiles({ name: "worksheet.txt", mimeType: "text/plain", buffer: Buffer.from("private worksheet bytes") });
  await expect(page.getByText("Private upload: worksheet.txt")).toBeVisible();
  await page.getByRole("button", { name: "Save lesson", exact: true }).click();
  await expect(page.getByRole("button", { name: "Save lesson", exact: true })).toBeDisabled();
  expect(state.blocks[0]!.data.assetId).toBe(assetId); expect(state.blocks[0]!.data.url).toBe("");
  await page.getByRole("button", { name: "Preview lesson", exact: true }).click();
  await expect(page.getByRole("link", { name: "Private worksheet (new tab)" })).toHaveAttribute("href", /content\?ticket=temporary-fixture/);
});

test("invitation email failure keeps the code and resend reports its outcome", async ({ page }) => {
  await portal(page);
  const failed = { status: "FAILED", message: "Email could not be sent. Share the invitation code directly or retry in a minute." };
  await page.route("**/v1/orgs/lms-org/invites", (route) => route.fulfill({ json: { success: true, data: route.request().method() === "POST" ? { token: "retained-invitation-code", delivery: failed } : [{ id: "mail-invite", email: "learner@example.test", roles: ["MEMBER"], expiresAt: "2027-01-01", emailStatus: "FAILED" }] } }));
  await page.route("**/v1/orgs/lms-org/invites/mail-invite/resend", (route) => route.fulfill({ json: { success: true, data: { token: "retained-invitation-code", delivery: { status: "SENT", message: "Invitation email accepted for delivery." } } } }));
  await page.goto("/orgs?org=lms-org&tab=people");
  await page.getByRole("button", { name: "Invite a person", exact: true }).click();
  await page.getByLabel("Email", { exact: true }).fill("learner@example.test");
  await page.getByRole("button", { name: "Create invitation", exact: true }).click();
  await expect(page.getByText(/Email could not be sent/)).toBeVisible();
  await expect(page.locator("#invite-person").getByLabel("Invitation code", { exact: true })).toHaveValue("retained-invitation-code");
  await page.getByRole("button", { name: "Resend email", exact: true }).click();
  await expect(page.getByText("Invitation email accepted for delivery.", { exact: true })).toBeVisible();
});
