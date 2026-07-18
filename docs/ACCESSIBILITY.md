# Accessibility

**Audience:** frontend engineers, QA, design.
**Related:** [FRONTEND](FRONTEND.md) · [DESIGN](DESIGN.md) · [PERFORMANCE](PERFORMANCE.md)

---

## Table of Contents

- [Posture](#posture)
- [The CI gate](#the-ci-gate)
- [WCAG compliance](#wcag-compliance)
- [Reduced motion](#reduced-motion)
- [Semantic HTML](#semantic-html)
- [Keyboard navigation](#keyboard-navigation)
- [Screen readers](#screen-readers)
- [ARIA](#aria)
- [Colour & contrast](#colour--contrast)
- [Responsive behaviour](#responsive-behaviour)
- [Media & permissions](#media--permissions)
- [Gaps](#gaps)
- [Checklist](#checklist)

---

## Posture

Accessibility is the **only hard quality gate in CI**. Performance, best-practices, and SEO are warnings; accessibility is an `error`.

```json
"categories:accessibility":  ["error", { "minScore": 0.9 }],
"categories:performance":    ["warn",  { "minScore": 0.6 }],
"categories:best-practices": ["warn",  { "minScore": 0.8 }],
"categories:seo":            ["warn",  { "minScore": 0.9 }]
```

> [!NOTE]
> That single `error` is a deliberate values statement: **an a11y regression blocks the build; a performance regression does not.** Few codebases make that trade explicitly.

---

## The CI gate

`lighthouserc.json`, run by `.github/workflows/lighthouse.yml`:

| Property | Value |
| --- | --- |
| Server | `pnpm --filter @eyf/web start` |
| URL | `http://localhost:3000/` |
| Runs | 1 |
| Preset | desktop |
| Gate | accessibility ≥ 0.90 (**error**) |

> [!WARNING]
> The gate covers **the landing page only**, on **desktop**, in **one run**. The authenticated application — dashboard, problems, mocks, admin, the org portal — is **not** audited. The strong signal is narrow; do not read a passing build as "the app is accessible".

---

## WCAG compliance

> [!WARNING]
> **No formal WCAG conformance level (A / AA / AAA) is declared or verified anywhere in the repository.** Claiming a level would be a fabrication.

What exists is a Lighthouse score ≥ 0.90 on one page. Lighthouse's a11y audit is **automated only** — it detects roughly a third of WCAG issues and cannot assess focus order, meaningful alt text, or screen-reader comprehension.

| Item | Status |
| --- | --- |
| Automated audit on landing | ✅ ≥ 0.90, enforced |
| Automated audit on app routes | ❌ **Needs implementation** |
| Manual keyboard audit | ❌ **Needs implementation** |
| Screen-reader testing | ❌ **Needs implementation** |
| Declared WCAG level | ❌ **Not implemented** |
| VPAT / accessibility statement | ❌ **Not implemented** |

`apps/web/app/security/` exists as a public page; there is **no** `/accessibility` statement page.

---

## Reduced motion

The strongest a11y implementation in the codebase — handled at the **primitive**, so it is correct everywhere by default.

```tsx
export function Reveal({ children, delay = 0, y = 16, className }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >{children}</motion.div>
  );
}
```

> [!TIP]
> `initial={reduce ? false : …}` **disables** the animation rather than shortening it — the correct behaviour for `prefers-reduced-motion`. Shortening still moves the element and can still trigger vestibular symptoms.

| Mechanism | Where |
| --- | --- |
| `useReducedMotion()` (Framer) | `components/motion.tsx` |
| `useIsReduced()` | `apps/web/lib/use-is-reduced.ts` |

The motion brief also caps durations at 300–600ms and uses `once: true` so animations never re-trigger on scroll.

> [!WARNING]
> The landing page uses `lenis` smooth scrolling and a WebGL background (`AntigravityBackground`). **Hijacked scrolling is a known accessibility risk** for motion-sensitive and screen-reader users. Verify that `lenis` and the WebGL layer respect `prefers-reduced-motion`; `roadmap-3d` previously degraded gracefully without WebGL, which is the right instinct.

---

## Semantic HTML

The shared `Field` primitive renders a **real `<label>` wrapping its control**, which associates them without needing `htmlFor`/`id` plumbing:

```tsx
export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="text-text-3 text-xs uppercase tracking-wider">
        {label}{hint && <span className="text-text-4 normal-case tracking-normal"> · {hint}</span>}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
```

> [!TIP]
> Wrapping is why extracting `Field` into one shared component (from 13 duplicates) is an accessibility win as well as a maintainability one — the correct labelling is now defined once.

> [!WARNING]
> The label text is styled `uppercase` via CSS (`text-xs uppercase tracking-wider`), not authored in caps. That is correct — CSS `text-transform` preserves the original string for screen readers, whereas typing `"TITLE"` would be read letter-by-letter by some assistive tech.

Other structure: `app/layout.tsx` sets the document shell, `not-found.tsx` and `error.tsx` provide real error pages, and `next/font` prevents layout shift.

---

## Keyboard navigation

| Feature | Status |
| --- | --- |
| Command palette (⌘K) | ✅ `components/command-palette.tsx` |
| Native controls | ✅ Buttons/inputs/links from `@eyf/ui` are real elements |
| Focus-visible styling | ✅ `focus-visible:ring-2 ring-accent` on `@eyf/ui` Button + interactive controls |
| Skip-to-content link | ✅ `components/app-shell.tsx` — first focusable, targets `#main-content` (WCAG 2.4.1) |
| Focus trap in modals | ✅ Mobile drawer traps Tab, Escape closes, focus returns to trigger (`app-shell.tsx`) |
| Documented tab order | ❌ **Needs implementation** |

> [!NOTE]
> The authenticated app (`AppShell`) implements the skip link, the `<main id="main-content" tabIndex={-1}>` target, and a full drawer focus trap. The **marketing/legal pages** (outside `AppShell`) do not yet carry a skip link — lower priority since their navigation is shallow, but worth adding for full coverage.

---

## Screen readers

**No screen-reader testing is documented.**

| Concern | Status |
| --- | --- |
| `alt` text on images | ⚠️ Not audited |
| Live regions for async updates | ⚠️ Unverified — SWR updates may be silent |
| `sonner` toast announcements | ⚠️ Unverified (the library supports ARIA live regions) |
| Decorative WebGL marked `aria-hidden` | ⚠️ Unverified |
| Icon-only buttons labelled | ⚠️ Unverified |

> [!WARNING]
> `EmptyState` renders an icon plus title/description. Icons rendered from the `Icons` map should be `aria-hidden` (decorative) so screen readers announce the text once, not the icon and the text. Verify before claiming conformance.

---

## ARIA

No systematic ARIA audit has been performed. The codebase leans on **semantic HTML first**, which is the correct order of preference (ARIA is a fallback, not a starting point).

> [!TIP]
> The first rule of ARIA is not to use ARIA — a native `<button>` beats `<div role="button" tabindex="0">`. The `Field`/`@eyf/ui` primitives already follow this.

---

## Colour & contrast

Theming uses CSS custom properties with light and dark modes and an app-wide toggle (`components/theme.tsx`). Tokens are consumed as Tailwind classes (`text-text-3`, `text-text-4`, `border-border`).

| Item | Status |
| --- | --- |
| Light + dark themes | ✅ |
| Token system (no hardcoded hex) | ✅ |
| Lighthouse contrast check on landing | ✅ (part of the ≥0.90 gate) |
| Contrast ratios computed per token (both themes) | ✅ text-1…text-4 measured against bg + surface…surface-3 |
| Contrast verified + fixed in **dark** mode | ✅ `text-4` lifted to clear AA on card surfaces |

> [!NOTE]
> **Measured (WCAG 1.4.3, 4.5:1 for normal text).** Light mode: `text-3`/`text-4` clear AA on every background (4.5–6.1:1). Dark mode: `text-3` clears AA everywhere; `text-4` previously passed only on `--bg` (4.53) and **failed on card surfaces** (4.26 / 4.03 / 3.73 on surface / surface-2 / surface-3). Fixed by lifting dark `--text-4` from `116 121 132` → `130 135 146`, which now measures **4.52–5.50:1** across all surfaces while staying dimmer than `text-3` (hierarchy preserved). `text-1`/`text-2` are well above AA in both themes.

Related history: a past commit fixed *"footer readability on the landing"* and *"light-theme artifacts"* — contrast issues have been real here.

> [!TIP]
> Never hardcode a hex value. Use a token, so both themes stay correct and contrast can be fixed in one place.

---

## Responsive behaviour

| Feature | Status |
| --- | --- |
| Tailwind breakpoints (shared preset) | ✅ |
| Collapsible sidebar | ✅ |
| Fluid landing sections | ✅ |
| Documented device matrix | ❌ **Needs implementation** |
| Mobile Lighthouse run | ❌ desktop preset only |

> [!NOTE]
> EYF targets Indian engineering students, a **mobile-heavy** audience — yet the only automated audit uses the **desktop** preset. Adding a mobile Lighthouse run is high-value and low-effort.

There is also a native app (`apps/mobile`, Expo) for a subset of features (daily challenge, flashcards, streak).

---

## Media & permissions

```
Permissions-Policy: camera=(self), microphone=(self), geolocation=(), payment=(), usb=()
```

Camera and microphone are allowed **to self** because peer mocks and voice interviews need them; everything else is denied.

| Concern | Status |
| --- | --- |
| Captions/transcripts for AI mock audio | ⚠️ Whisper transcribes user audio; whether AI responses are shown as text is unverified |
| Permission-denied fallback | ⚠️ Unverified — `use-recorder.ts` |
| Non-audio alternative for drills | ❌ **Not implemented** |

> [!WARNING]
> Communication drills and AI mocks are **audio-first**. A d/Deaf or speech-impaired user, or anyone without a microphone, may be unable to complete them — and they feed the Placement Readiness score. If a pillar of the core metric is unreachable, the score itself becomes inaccessible. A text-based alternative would be a substantive fix.

---

## Gaps

Ranked by user impact:

| # | Gap | WCAG |
| --- | --- | --- |
| 1 | Skip-to-content link missing on **marketing/legal** pages (present in the app) | 2.4.1 (A) |
| 2 | **Only the landing page is audited** | — |
| 3 | **No mobile audit** despite a mobile-first audience | — |
| 4 | ~~Dark-mode contrast unverified~~ — measured + `text-4` fixed to AA | 1.4.3 (AA) ✅ |
| 5 | **No audio alternative** for drills/mocks | 1.2.x (A/AA) |
| 6 | No screen-reader testing | Multiple |
| 7 | No declared conformance level or statement page | — |
| 8 | Live regions for async updates — now present on key surfaces (dashboard, mock chat, verdicts); remainder unverified | 4.1.3 (AA) |
| 9 | `lenis` smooth scroll + WebGL vs. reduced motion unverified | 2.3.3 (AAA) |

### Recommended next steps

1. Extend the skip-link to the marketing/legal layouts (the app already has it).
2. Add authenticated routes + a mobile preset to `lighthouserc.json`.
3. Audit dark-mode contrast per token and record ratios in [DESIGN](DESIGN.md).
4. Verify `lenis`/WebGL honour `prefers-reduced-motion`.
5. Add `eslint-plugin-jsx-a11y` — static coverage on every PR, cheap to adopt.
6. Manual keyboard + screen-reader pass on the core loop (dashboard → problem → submit).
7. Decide a target (WCAG 2.1 AA is the norm) and publish an accessibility statement.

---

## Checklist

For every new UI change:

- [ ] Real semantic elements (`<button>`, `<label>`, `<nav>`) — not `div` with a role
- [ ] Labels via the `Field` primitive or a real `<label>`
- [ ] Motion via `Reveal` / `useReducedMotion()`; `initial={reduce ? false : …}`
- [ ] Design tokens only — no hardcoded hex
- [ ] Verified in **both** light and dark
- [ ] Keyboard-reachable and operable; visible focus
- [ ] Decorative icons `aria-hidden`
- [ ] Icon-only buttons carry an accessible name
- [ ] Async updates announced (live region) where meaningful
- [ ] Text alternative for any audio/visual-only interaction
- [ ] Lighthouse a11y still ≥ 0.90

---

**Next:** [DESIGN.md](DESIGN.md) · [FRONTEND.md](FRONTEND.md) · [ROADMAP.md](ROADMAP.md)
