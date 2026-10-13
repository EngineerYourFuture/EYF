# EYF Design System

> The one thing a student should feel in the first 3 seconds: **this is serious, professional-grade software for people serious about getting placed** — not another cheap edtech site.

## Thesis

Premium restraint, like Apple / Tesla / Gemini. Monochrome canvas, precise typography, real materials, physical motion. Color is earned, not sprayed. **The absence of decoration is the design.**

### Hard rules (what makes it look expensive vs. cheap)
- **NO neon.** No `#E8FF47` lime, no saturated glows.
- **NO gradients** as decoration — no aurora blobs, no colored radial glows, no gradient buttons. (A near-invisible neutral vignette for depth is fine.)
- **NO colored shadows.** Shadows are neutral black, soft, physical.
- **One accent, used ~5% of the time.** Red `#E8192C` (the brand mark) for the single most important action on a screen and active state. Everything else is monochrome.
- Whitespace is a feature. Let things breathe.

## Color

Tokens live in `apps/web/app/globals.css` as space-separated RGB channels (`:root` = dark, `:root.light` = light). Names are stable; only values changed from the old lime system.

### Dark (default)
| Token | RGB | Use |
|-------|-----|-----|
| `--bg` | `10 10 10` | canvas `#0A0A0A` |
| `--surface` → `--surface-3` | `20/26/34` | cards, raised |
| `--border` / `--border-2` | `38` / `54` | hairlines |
| `--text-1` → `--text-4` | `245 / 168 / 120 / 82` | text scale |
| `--accent` (mono primary) | `245 245 245` | primary buttons/links = near-white |
| `--accent-ink` | `10 10 10` | text on the white primary |
| `--brand` (red, sparing) | `232 25 44` | `#E8192C` — the ONE key CTA + active state + logo |

### Light
| `--bg` | `250 250 249` off-white | `--accent` | `18 18 20` near-black primary |
| `--brand` | `212 18 36` | slightly deeper red for white bg |

### Functional (difficulty/status) — muted, never neon
`--easy 90 190 120` · `--medium 200 160 70` · `--hard 210 90 70` · `--expert 176 112 160` · `--info 120 150 190`. Desaturated so they read as refined data, not candy.

## Typography

- **Display + Sans: Geist** (Vercel's grotesque — clean, modern, premium). Replaces Inter everywhere. Loaded in `layout.tsx`.
- **Mono: Geist Mono** — labels, code, metrics, the `font-mono` micro-caps.
- Headlines: large, tight tracking (`-0.02` to `-0.03em`), weight 500-600 (not 800 — confidence, not shouting).
- Body: 400/500, generous line-height (1.5-1.6).
- Micro-labels: `font-mono`, uppercase, `tracking-[0.2em]`, `text-3`.

## Space, radius, elevation

- Radius: `sm 4 · md 8 · lg 12 · xl 16 · 2xl 24`. Prefer `lg`/`xl` for cards.
- Shadows (neutral only): `card`, `card-lg` — soft black. No `glow`.
- Borders do most of the separation work; shadows are subtle.

## Motion

Keep the immersive 3D scroll (Three.js particle field + Framer scroll-film in `components/landing/`) but **monochrome + physical**:
- Particles: white/gray at low opacity on near-black. No colored points.
- Scroll-driven reveals: depth, parallax, weight, scale. Ease `[0.16, 1, 0.3, 1]`.
- Motion should feel like heavy, precise machinery (Tesla), not floaty (AI slop).
- Respect `prefers-reduced-motion`.

### Shared interaction rules

- Buttons respond on press; navigation uses a colour change and action buttons use a small scale. Touch targets are at least 2.75rem, and button height can grow with text.
- Shared dialogs, search and mobile navigation use the same critically damped spring (`interaction-motion.tsx`). Opening and closing follow the same path; a new input can reverse an in-flight transition.
- Use `Modal` for blocking tasks. It combines the native dialog top layer with keyboard containment, Escape, focus restoration and a shared scroll lock for nested dialogs. Initial focus uses `data-autofocus` when supplied; confirmations start on Cancel.
- Local page search updates immediately. Only remote problem queries are debounced.
- `useMotionPreference` responds to preference changes while the page is open. Reduced motion uses fades or static feedback; smooth scrolling stops. Glass becomes solid for reduced transparency or increased contrast, with stronger borders for increased contrast.
- Keep Geist for the established EYF identity, with optical sizing enabled. Use weight and tracking to distinguish headings, and allow enlarged text to wrap.
- The LMS outline is a disclosure on phones and a persistent rail on desktop. Lesson selection moves focus to the lesson heading; progress uses a transform rather than animating layout width.
- Private workspace navigation groups personal learning, training operations, people, and workspace settings. Desktop uses a vertical keyboard-accessible list; phones use a grouped section selector. Organization and section live in the URL so returning from a course restores context.
- Join, invitation, course, program, and cohort creation forms open on request. Explain the course → program → cohort prerequisites where they matter. Search current lists without adding a separate search screen.
- Role choices use names and descriptions beside a permission preview computed from the shared capability map. Keep scope and account status visible; never suggest organization roles grant platform administration.
- Lesson authors can preview current edits with the learner renderer before publishing. Quiz questions come before individual answers and a direct correct-answer choice. Block actions meet the 44px touch target; removal has an undo action.
- Unsaved lesson exits prompt consistently, including the shared LMS home link. In-memory drafts are scoped to the signed-in account, organization, course, and lesson and survive internal navigation. Save before refreshing, closing the tab, or signing out; private lesson drafts are not stored in localStorage or sessionStorage.
- Completing a course shows saved progress and a real next assigned course or return to program progress. Assessment and certificate requirements remain explicit and separate.

## Components

- **Primary button:** monochrome fill (`bg-accent` = white on dark / black on light), `text-accent-ink`. No glow, no gradient.
- **The ONE key action** per screen (hero CTA, "Start"): `bg-brand` red. Use sparingly.
- **Secondary button:** transparent, `border-border`, `text-1` on hover.
- **Cards:** `bg-surface`, `border-border`, `rounded-xl`, `shadow-card`. Hover: border brightens to `edge`.
- **Active nav / selected:** `--brand` red indicator (a thin bar or dot), not a fill.

## Do / Don't
- ✅ Monochrome, one red accent, big type, real shadows, generous space, physical motion.
- ❌ Neon lime, gradient fills, colored glows, blur-blobs, everything-centered, decorative emoji, 800-weight shouting headlines.

_Locked 2026-07-02 via /design-consultation. Supersedes the lime "design-system-overhaul"._
