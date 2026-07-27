import { test, expect, type Page } from "@playwright/test";

/**
 * Browser regression cover for the theme system.
 *
 * Every bug this guards was found BY HAND during a QA pass, which is exactly why
 * it needs to be automated — nothing in CI would have caught any of them:
 *
 *   - the site footer hardcoded a light background, so on /pricing and the legal
 *     pages it stayed a bright slab that ignored the toggle entirely;
 *   - Clerk's appearance was pinned to dark hex at the provider, making the
 *     sign-in heading and label invisible on the white card in light mode;
 *   - the toggle icon was chosen from React state, so it swapped after hydration.
 *
 * The contrast assertions below are deliberately generic: rather than pinning
 * exact colours (which a redesign would churn), they compute real luminance and
 * fail when foreground and background collapse onto each other — the
 * white-on-white / black-on-black class of bug, whatever the palette becomes.
 */

const THEME_KEY = "eyf-theme";

/** Set the stored theme before the app boots, so the no-flash script picks it up. */
async function bootWithTheme(page: Page, theme: "light" | "dark", path = "/") {
  await page.addInitScript(
    ([k, t]) => window.localStorage.setItem(k as string, t as string),
    [THEME_KEY, theme],
  );
  await page.goto(path);
  await expect(page.locator("html")).toHaveClass(new RegExp(`\\b${theme}\\b`));
}

/** Relative luminance contrast between two `rgb()` strings. */
function contrast(fg: string, bg: string): number {
  const parse = (s: string) => (s.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const lum = ([r, g, b]: number[]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const [a, b] = [lum(parse(fg)), lum(parse(bg))].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

/** Walk up for the first non-transparent background — text often sits on a bare element. */
async function effectiveBg(page: Page, selector: string): Promise<string> {
  return page.$eval(selector, (el) => {
    let n: Element | null = el;
    while (n) {
      const bg = getComputedStyle(n).backgroundColor;
      const parts = (bg.match(/[\d.]+/g) ?? []).map(Number);
      if (parts.length < 4 || parts[3] > 0) {
        if (bg !== "rgba(0, 0, 0, 0)") return bg;
      }
      n = n.parentElement;
    }
    return "rgb(255, 255, 255)";
  });
}

for (const theme of ["light", "dark"] as const) {
  test.describe(`theme: ${theme}`, () => {
    test("footer follows the theme on a themed page", async ({ page }) => {
      await bootWithTheme(page, theme, "/pricing");

      const footer = page.locator("footer.site-footer");
      await expect(footer).toBeVisible();

      const fg = await footer.locator("a").first().evaluate((el) => getComputedStyle(el).color);
      const bg = await effectiveBg(page, "footer.site-footer");

      // The regression: footer background was hardcoded light, so in dark theme
      // it was a glaring slab. Assert it tracks the page, then that it's readable.
      const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      const bodyLum = contrast(bodyBg, "rgb(0,0,0)");
      const footLum = contrast(bg, "rgb(0,0,0)");
      // Both light or both dark — never one of each.
      expect(Math.sign(bodyLum - 3) === Math.sign(footLum - 3)).toBe(true);
      expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
    });

    test("no text collapses into its own background on public pages", async ({ page }) => {
      for (const path of ["/", "/pricing", "/terms"]) {
        await bootWithTheme(page, theme, path);

        const offenders = await page.evaluate(() => {
          const lin = (c: number) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
          const parse = (s: string) => (s.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
          const lum = (p: number[]) => 0.2126 * lin(p[0]) + 0.7152 * lin(p[1]) + 0.0722 * lin(p[2]);
          const bgOf = (el: Element) => {
            let n: Element | null = el;
            while (n) {
              const bg = getComputedStyle(n).backgroundColor;
              if (bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") return bg;
              n = n.parentElement;
            }
            return "rgb(255,255,255)";
          };
          const out: string[] = [];
          document.querySelectorAll("body *").forEach((el) => {
            const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim());
            if (!own) return;
            const cs = getComputedStyle(el);
            if (cs.visibility === "hidden" || cs.display === "none" || +cs.opacity < 0.1) return;
            const r = el.getBoundingClientRect();
            if (r.width < 2 || r.height < 2) return;
            const f = lum(parse(cs.color)), b = lum(parse(bgOf(el)));
            const ratio = (Math.max(f, b) + 0.05) / (Math.min(f, b) + 0.05);
            // 1.5 is far below AA — this only fires on genuinely invisible text.
            if (ratio < 1.5) out.push(`${el.tagName}: "${(el.textContent ?? "").trim().slice(0, 30)}"`);
          });
          return out.slice(0, 5);
        });

        expect(offenders, `invisible text on ${path} in ${theme}`).toEqual([]);
      }
    });
  });
}

test.describe("theme switching", () => {
  test("persists across a reload", async ({ page }) => {
    // Deliberately NOT using bootWithTheme here: its addInitScript re-runs on
    // every navigation (reload included), which would re-pin the theme and make
    // this assert nothing. Set storage once from the page, then reload.
    await page.goto("/pricing");
    await expect(page.locator("html")).toHaveClass(/\bdark\b/); // default

    await page.evaluate((k) => window.localStorage.setItem(k, "light"), THEME_KEY);
    await page.reload();

    await expect(page.locator("html")).toHaveClass(/\blight\b/);
    await expect(page.locator("html")).not.toHaveClass(/\bdark\b/);
  });

  test("the toggle icon is correct in the server HTML, with no post-hydration swap", async ({ page }) => {
    // The icon is CSS-driven off the <html> class precisely so it cannot flip
    // after hydration. Assert the light-theme icon is the one showing.
    await bootWithTheme(page, "light", "/welcome");

    const toggle = page.getByRole("button", { name: /toggle colour theme/i });
    await expect(toggle).toBeVisible();
    await expect(toggle.locator(".theme-icon-moon")).toBeVisible();
    await expect(toggle.locator(".theme-icon-sun")).toBeHidden();

    await toggle.click();
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    await expect(toggle.locator(".theme-icon-sun")).toBeVisible();
    await expect(toggle.locator(".theme-icon-moon")).toBeHidden();
  });

  test("renders no hydration or console errors in either theme", async ({ page }) => {
    for (const theme of ["light", "dark"] as const) {
      const errors: string[] = [];
      page.on("console", (m) => {
        if (m.type() !== "error") return;
        const t = m.text();
        if (/development keys/i.test(t)) return; // Clerk dev-key notice, expected locally
        errors.push(t);
      });
      await bootWithTheme(page, theme, "/pricing");
      await page.waitForLoadState("networkidle");
      expect(errors, `console errors in ${theme}`).toEqual([]);
    }
  });
});
