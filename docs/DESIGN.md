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
