import { test, expect } from "@playwright/test";
import { portal } from "./fixtures/lms";

// The guidance engine and the missions service send lowercase icon names.
const pillar = (key: string, label: string, icon: string, href: string) =>
  ({ key, label, icon, href, score: 30, weight: 1 / 6, detail: `${label} detail`, action: `Improve ${label}` });
const pillars = [
  pillar("dsa", "Problem Solving", "code", "/problems"), pillar("interview", "Interview Practice", "mic", "/mocks"),
  pillar("aptitude", "Aptitude", "clipboard", "/mcq"), pillar("resume", "Resume", "doc", "/resume"),
  pillar("consistency", "Consistency", "flame", "/dashboard"), pillar("projects", "Projects", "cube", "/projects"),
];
const guidance = {
  readiness: { overall: 30, band: "Building", summary: "Keep going.", pillars, nextActions: pillars.slice(0, 3).map((p) => ({ label: p.action, detail: p.detail, href: p.href, icon: p.icon })) },
  // "rocket" is not in the icon set: one unknown name must fall back, not crash.
  actions: [...pillars.slice(0, 2), { ...pillars[5]!, icon: "rocket" }].map((p) => ({ pillarKey: p.key, label: p.action, reason: `Why ${p.label}`, href: p.href, icon: p.icon, score: p.score, weight: p.weight, impact: 10 })),
  coachNote: "Start with problem solving.", generatedAt: "2026-10-22T08:00:00Z", partial: false,
};
const mission = { date: "2026-10-22", earnedXp: 0, bonusXp: 50, allDone: false, claimed: false, tasks: [
  { key: "solve", label: "Solve a problem", detail: "Keep your DSA sharp", href: "/problems", icon: "code", xp: 20, done: false },
  { key: "revise", label: "Review 3 flashcards", detail: "Spaced repetition", href: "/subjects", icon: "book", xp: 15, done: false },
  { key: "sharpen", label: "Train or assess", detail: "A brain game", href: "/games", icon: "brain", xp: 15, done: false },
] };

// Value: protects=/readiness and /today render pillars, next actions and mission tasks whose icon names arrive lowercase (or unknown) from the API;
// fails_when=icon lookup goes back to indexing the PascalCase Icons map, or the unknown-name fallback is dropped, so the page hits its error boundary;
// why_new=no spec renders guidance or missions with real icon names; payment-preview reaches /today with null guidance only; seam=none;
// no_claim=engine output shape (hand-written payload mirrors @eyf/types readiness + missions service; API mocked)
test("readiness and today render lowercase and unknown icon names without an error page", async ({ page }) => {
  await portal(page);
  await page.addInitScript(() => localStorage.setItem("eyf-consent", "denied"));
  await page.route("**/v1/guidance/me", (r) => r.fulfill({ json: { success: true, data: guidance } }));
  await page.route("**/v1/missions/today", (r) => r.fulfill({ json: { success: true, data: mission } }));
  await page.route("**/v1/roadmap/today", (r) => r.fulfill({ json: { success: true, data: { challenge: null, streak: 2, xpToday: 0, problemsSolvedToday: 0 } } }));

  await page.goto("/readiness");
  const breakdown = page.getByRole("heading", { name: "What makes up your score" }).locator("..");
  await expect(breakdown.getByRole("link")).toHaveCount(6);
  await expect(breakdown.getByRole("link").locator("svg")).toHaveCount(6);
  await expect(page.getByRole("heading", { name: "Do this next" })).toBeVisible();
  await expect(page.getByText("This page hit an error")).toHaveCount(0);

  await page.goto("/today");
  await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Improve Projects/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Train or assess/ })).toBeVisible();
  await expect(page.getByText("This page hit an error")).toHaveCount(0);
});
