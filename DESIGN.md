---
name: EYF — Engineer Your Future
description: A graphite-and-white placement instrument with one Signal Red; serious, professional-grade software for people serious about getting placed.
colors:
  bg: "rgb(9 10 13)"
  bg-2: "rgb(12 13 17)"
  surface: "rgb(17 19 24)"
  surface-2: "rgb(22 25 31)"
  surface-3: "rgb(29 32 40)"
  border: "rgb(33 36 44)"
  edge: "rgb(48 52 63)"
  text-1: "rgb(244 245 248)"
  text-2: "rgb(166 171 182)"
  text-3: "rgb(138 144 156)"
  text-4: "rgb(130 135 146)"
  accent: "rgb(244 245 248)"
  accent-hover: "rgb(210 214 222)"
  accent-tint: "rgb(29 32 40)"
  accent-ink: "rgb(9 10 13)"
  brand: "rgb(235 38 55)"
  brand-hover: "rgb(205 28 46)"
  brand-ink: "rgb(255 255 255)"
  easy: "rgb(90 190 120)"
  medium: "rgb(200 160 70)"
  hard: "rgb(210 90 70)"
  expert: "rgb(176 112 160)"
  info: "rgb(120 150 190)"
  light-bg: "rgb(248 249 251)"
  light-bg-2: "rgb(242 244 247)"
  light-surface: "rgb(255 255 255)"
  light-surface-2: "rgb(252 253 255)"
  light-surface-3: "rgb(239 241 245)"
  light-border: "rgb(225 228 234)"
  light-edge: "rgb(209 213 221)"
  light-text-1: "rgb(17 19 24)"
  light-text-2: "rgb(66 71 82)"
  light-text-3: "rgb(92 98 110)"
  light-text-4: "rgb(104 110 122)"
  light-accent: "rgb(17 19 24)"
  light-accent-hover: "rgb(38 41 48)"
  light-accent-tint: "rgb(239 241 245)"
  light-accent-ink: "rgb(255 255 255)"
  light-brand: "rgb(214 24 42)"
  light-brand-hover: "rgb(186 16 34)"
  light-easy: "rgb(40 150 90)"
  light-medium: "rgb(170 120 20)"
  light-hard: "rgb(190 60 45)"
  light-expert: "rgb(150 80 140)"
  light-info: "rgb(60 110 170)"
  lp-ink: "rgb(11 13 19)"
  lp-paper: "rgb(241 242 245)"
  lp-graphite: "rgb(58 63 75)"
  lp-placed: "rgb(46 158 91)"
typography:
  display:
    fontFamily: "Geist, ui-sans-serif, system-ui"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  metric:
    fontFamily: "Geist, ui-sans-serif, system-ui"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1
  headline:
    fontFamily: "Geist, ui-sans-serif, system-ui"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.4
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.55
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
    fontFeature: "\"ss01\""
  prose:
    fontFamily: "Geist, ui-sans-serif, system-ui"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  control:
    fontFamily: "Geist, ui-sans-serif, system-ui"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.43
    letterSpacing: "-0.025em"
  label:
    fontFamily: "Geist Mono, JetBrains Mono, ui-monospace, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.05em"
  caption:
    fontFamily: "Geist, ui-sans-serif, system-ui"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.33
  marketing-display:
    fontFamily: "Bricolage Grotesque, Geist, ui-sans-serif, system-ui"
    fontSize: "clamp(2.6rem, 6.2vw, 5rem)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.02em"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  2xl: "24px"
  full: "9999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
  "10": "40px"
  "12": "48px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    typography: "{typography.control}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-brand:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.brand-ink}"
    typography: "{typography.control}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-brand-hover:
    backgroundColor: "{colors.brand-hover}"
  button-secondary:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text-1}"
    typography: "{typography.control}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-secondary-hover:
    backgroundColor: "{colors.surface-3}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-2}"
    typography: "{typography.control}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-ghost-hover:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.text-1}"
  button-danger:
    backgroundColor: "rgb(210 90 70 / 0.1)"
    textColor: "{colors.hard}"
    typography: "{typography.control}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "24px"
  stat-tile:
    backgroundColor: "{colors.surface}"
    typography: "{typography.metric}"
    rounded: "{rounded.xl}"
    padding: "20px"
  metric-tile:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "16px"
  input:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.text-1}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  badge:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.text-2}"
    rounded: "{rounded.sm}"
    padding: "0 8px"
    height: "24px"
  badge-easy:
    backgroundColor: "rgb(90 190 120 / 0.1)"
    textColor: "{colors.easy}"
    rounded: "{rounded.sm}"
    padding: "0 8px"
    height: "24px"
  tab:
    textColor: "{colors.text-3}"
    typography: "{typography.body}"
    padding: "8px 12px"
    height: "44px"
  tab-active:
    textColor: "{colors.text-1}"
  nav-item:
    textColor: "{colors.text-2}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  nav-item-active:
    backgroundColor: "{colors.accent-tint}"
    textColor: "{colors.text-1}"
  dialog:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.2xl}"
    padding: "24px"
    width: "448px"
---

# Design System: EYF — Engineer Your Future

## Overview

**Creative North Star: "The Precision Instrument"**

EYF is a calibrated instrument for people preparing seriously for placement. The casing is Cool Graphite with a faint blue undertone, the readouts are Instrument White, and a single Signal Red lamp says "act here". Nothing on screen is decoration. Depth comes from hairlines and tonal steps, emphasis from type weight and size, and motion from critically damped springs that feel like heavy, precise machinery rather than something floating. The absence of decoration is the design.

The authenticated app is an Operate surface: sidebar, tabs, metric tiles, tables, code and forms, set mostly at 14px with Geist Mono carrying numbers and data labels. It runs dark by default and ships a full light theme (Cool Paper canvas, Instrument Black primary) behind a toggle. The two themes are the same instrument under different ambient light, and both derive from one set of RGB-channel tokens. The public marketing landing is the deliberate exception: a light-only editorial surface that moves from night-shift ink to offer-morning paper, is set in Bricolage Grotesque, and is scoped to `.landing-root` so none of it leaks into the app.

Motion follows one grammar. Overlays (dialogs, search, the mobile menu) share a critically damped spring and can reverse mid-flight. State changes take 150ms ease-out. Reveals rise 8px over 0.4s on `cubic-bezier(0.16, 1, 0.3, 1)`. Buttons answer the press, not the hover. Preferences are honored live: reduced motion swaps movement for fades or static feedback and stops smooth scrolling, while reduced transparency or increased contrast turns glass solid. The confirmed rejections, first locked on 2026-07-02 and still enforced in code, are neon (the retired lime `#E8FF47` system), decorative gradients, colored glows or shadows, blur blobs, everything-centered layouts, decorative emoji, and 800-weight shouting headlines inside the app.

**Key Characteristics:**
- Monochrome graphite and white, with Signal Red on roughly 5% of any screen.
- Borders before shadows; shadows are neutral, layered, and barely there on dark.
- Geist everywhere in the app, Geist Mono for data, headings at 700 and never 800.
- Dark default plus a full light theme, both from the same token names.
- Physical motion: shared springs, press feedback, live reduced-motion handling.
- The browser chrome is themed too: focus ring, text selection, scrollbars.

## Colors

Cool graphite neutrals with a whisper of blue, one red, and a desaturated status scale so data reads as data, not candy.

Tokens are space-separated RGB channels in `apps/web/app/globals.css` (`:root` is the dark default, `:root.light` the light theme). The Tailwind preset `packages/config/tailwind.preset.js` exposes them as utilities with alpha support (`bg-surface`, `text-text-3`, `border-edge`, `bg-brand/10`). `.theme-dark` and `.theme-light` force a palette on a subtree. In the frontmatter, unprefixed keys are the dark default and `light-*` keys are the light theme.

### Primary
- **Instrument White** (`accent`): the monochrome primary. It fills primary buttons and draws links, the focus ring, text selection, progress fills and the active nav icon. It shares its value with `text-1` but owns the action role. `accent-ink` is the text on it. In the light theme it inverts to **Instrument Black** (`light-accent`).

### Secondary
- **Signal Red** (`brand`): the one accent. It marks the single key action per screen (`Button variant="brand"`), the active indicator (sidebar bar, selected-tab underline) and the logo mark. The light theme deepens it (`light-brand`) to hold contrast on white. White on red clears 5.2:1 in both themes.

### Tertiary
The status scale, used for difficulty, outcomes and trends:
- **Sage** (`easy`): easy problems, upward trends, success.
- **Brass** (`medium`): medium difficulty, caution.
- **Clay** (`hard`): hard difficulty, downward trends, destructive actions.
- **Mauve** (`expert`): expert difficulty.
- **Slate Blue** (`info`): informational tags and neutral data.

Each has a darker light-theme counterpart (`light-easy` and so on) tuned for AA on white. The `--play-*` channels exist only for the Stroop game, where named colors must read unmistakably, and are not UI colors.

### Neutral
- **Cool Graphite** (`bg`): the app canvas. **Graphite Well** (`bg-2`) sits one step deeper for the footer and recessed bands.
- **Graphite Panel** (`surface`): cards, tiles, dialogs, and the sidebar behind its glass.
- **Raised Panel** (`surface-2`): secondary buttons, the search trigger, the top of elevated cards.
- **Lifted Panel** (`surface-3`): hover and pressed fills, default badges, progress tracks. `accent-tint` shares it for the active nav row.
- **Hairline** (`border`): every default divider and card border. **Edge** (`edge`, CSS `--border-2`) is the stronger line for hover borders, elevated cards and scrollbar thumbs.
- **Readout Grey** (`text-2`): secondary text and nav items. **Meta Grey** (`text-3`): labels and sub-text. **Faint Meta** (`text-4`): hints and inactive bottom tabs. Both meta tones clear WCAG AA on every surface they sit on (`text-4` measures 4.52:1 on `surface-3`).
- **Cool Paper** (`light-bg`): the light theme canvas, under white surfaces with the same roles.

### Marketing Landing
- **Night-Shift Ink** (`lp-ink`) and **Offer-Morning Paper** (`lp-paper`) are the two ends of the landing's story, with **Landing Graphite** (`lp-graphite`) for secondary text. `--lp-brand` is Signal Red.
- **Placed Green** (`lp-placed`): the earned payoff, used once, at the offer.

### Named Rules
**The One Signal Rule.** Signal Red marks one thing per screen: the key action, the active indicator, or the logo. If two red elements compete, one of them is wrong. Everything else is graphite and white.

**The Muted Data Rule.** Status hues appear as text, 10% tint fills and 40% borders. Never as solid fills behind text, never as glows.

**The Channel Rule.** Color is consumed through tokens (`bg-surface`, `text-brand`, `rgb(var(--border) / 0.7)`), never as hardcoded hex. The only sanctioned literal is Clerk's `colorPrimary: "#D6182A"`, because Clerk cannot parse a CSS variable.

## Typography

**Display Font:** Geist (with ui-sans-serif, system-ui)
**Body Font:** Geist (with ui-sans-serif, system-ui)
**Label/Mono Font:** Geist Mono (with JetBrains Mono, ui-monospace)
**Marketing Display Font:** Bricolage Grotesque (landing only, with Geist)

**Character:** One neutral grotesque carries the whole app, with weight and tight tracking doing the hierarchy; Geist Mono is the instrument's readout face for numbers, code and data labels. Both are self-hosted variable fonts from the `geist` package (weight axis only). `html` turns on Geist's `ss01` stylistic set, a tailless "a" that is part of the shipped look.

### Hierarchy
Headings take their role from a class in `globals.css` (`.type-display`, `.type-headline`, `.type-title`), never from size and weight utilities at the call site.

- **Display** (700, 1.875rem rising to 2.25rem at `sm`, 1.1, -0.025em): page titles through `PageHeader` or `.type-display`, one per page. LMS view titles use it too.
- **Metric** (700, 1.875rem rising to 2.25rem, 1): stat and metric-tile values, with tabular figures. The tone color is allowed here.
- **Headline** (700, 1.25rem, 1.4): section headings (`.type-headline`).
- **Title** (600, 1.125rem, 1.55): card, panel and dialog titles (`.type-title`), and subsections under a headline.
- **Body** (400, 0.875rem, 1.43): the app's working size for tables, navigation, forms and card copy.
- **Prose** (400, 1rem, 1.625, max 68ch): long-form legal pages, lesson content and explanations.
- **Control** (500, 0.875rem, -0.025em): button labels.
- **Label** (Geist Mono 400, 11px, 0.05em, uppercase): stat and metric-tile labels, badges, `kbd`. Bottom-tab and sidebar group labels drop to 10px, with the group labels at 0.1em. Form field labels use Geist at 12px, uppercase, 0.05em instead.
- **Caption** (400, 0.75rem, 1.33): hints, sub-text, timestamps.
- **Marketing Display** (Bricolage Grotesque 800, `clamp(2.6rem, 6.2vw, 5rem)`, 0.98, -0.02em): the landing hero only.

### Named Rules
**The Bold-Not-Black Rule.** App headings top out at 700. Weight 800 belongs to Bricolage Grotesque on the marketing landing and nowhere else.

**The Mono-Means-Measurement Rule.** Geist Mono sets numbers, code, keys and data labels. It never sets headings, buttons or prose.

**The Tabular Readout Rule.** Numbers that change or line up (metric values, timers, table columns) use tabular figures, so digits never jitter or misalign.

**The Wrap-Don't-Clip Rule.** Headings wrap when text is enlarged. Only single-line data such as metric values and labels may truncate.

## Layout

**App shell.** At `lg` (1024px) and up the app is a two-column grid: a 248px sidebar (frosted, sticky, full height, collapsible to zero with a floating reopen button) beside the main column. Below `lg`, a sticky 56px frosted header holds the menu, the logo and search, navigation opens in a full-height drawer, and a fixed 64px frosted bottom bar carries four daily destinations (Today, Solve, Score, Ask) plus the menu. The main column reserves 80px of bottom padding to clear that bar.

**Page container.** App pages sit in a centered column, 64rem (`max-w-5xl`) by default, 80rem (`max-w-7xl`) for wide data views, and 48 to 56rem (`max-w-3xl` / `max-w-4xl`) for focused single-task flows. Gutters are 16px, widening to 24px at `sm`; vertical padding is 32px, widening to 48px at `lg`.

**Rhythm.** The scale is Tailwind's 4px base. Inside components, 8 and 12px gaps dominate. Related blocks sit 16px apart and sections 24 to 32px apart. Cards pad 24px, stat tiles 20px, metric tiles 16px. Long-form text is capped at 68ch.

**Density and touch.** Density is that of a working tool. Desktop nav rows compress to 6px of vertical padding, but on coarse pointers every control grows to at least 44px (`min-h-11`; `.ui-button` reaches 2.75rem) and button height grows with its text. Breakpoints are Tailwind's defaults (`sm` 640, `md` 768, `lg` 1024, `xl` 1280); `lg` is the shell switch.

**Responsive patterns.** The LMS course outline is a disclosure on phones and a persistent rail on desktop. Private workspace navigation is a vertical, keyboard-accessible list on desktop and a grouped section selector on phones.

### Named Rules
**The Thumb Rule.** Anything tappable is at least 44px on touch. Desktop may compress; touch may not.

## Elevation & Depth

The system is a border-led hybrid. Separation is carried first by 1px hairlines (`border`, stepping up to `edge` on hover) and by tonal steps (`bg` → `surface` → `surface-2` → `surface-3`). Shadows are neutral (pure black on dark, near-black zinc in light, through the `--shadow` channel), soft and multi-layered, and on dark they are nearly invisible by design. Chrome that floats over scrolling content uses frosted glass with a 1px inset top highlight: the sidebar, mobile header and bottom bar, dialogs, and the command palette. The dialog backdrop is black at 60%.

### Shadow Vocabulary
- **Card** (`box-shadow: 0 1px 2px -1px rgb(var(--shadow) / 0.10), 0 4px 12px -3px rgb(var(--shadow) / 0.08), 0 12px 28px -8px rgb(var(--shadow) / 0.08)`): default cards, stat tiles, floating buttons.
- **Card Large** (`box-shadow: 0 2px 4px -2px rgb(var(--shadow) / 0.10), 0 8px 20px -4px rgb(var(--shadow) / 0.10), 0 28px 56px -12px rgb(var(--shadow) / 0.14)`): elevated cards, dialogs, and interactive cards on hover.
- **Inset Highlight** (`box-shadow: inset 0 1px 0 0 rgb(var(--hairline) / 0.06)`): the top-edge catchlight on raised surfaces. Glass raises it to 0.12, and strong glass to 0.14.
- **Glass** (`backdrop-filter: blur(18px) saturate(1.5)` over `surface` at 86%) and **Strong Glass** (`blur(24px) saturate(1.6)` at 94%): chrome and overlays only. Both fall back to near-solid where `backdrop-filter` is unsupported.

`shadow-glow` and `shadow-glow-sm` survive only as neutralized back-compat aliases.

### Named Rules
**The Hairline-First Rule.** Reach for a border or a tonal step before a shadow. A shadow you can clearly see on dark is too strong.

**The Glass-Is-Chrome Rule.** Frosted glass is for chrome over moving content. It turns solid under reduced transparency or increased contrast, and its border strengthens to `text-2` under increased contrast.

**The Neutral Shadow Rule.** Shadows are never colored and never glow.

## Shapes

Gently rounded, applied consistently by role. Buttons, inputs and nav rows are softly squared (8px). Icon buttons, the search trigger and compact admin inputs are a touch rounder (12px). Cards and tiles use 16px. Dialogs and large feature panels use 24px. Badges stay nearly square (4px) so they read as data tags rather than pills. Fully round shapes are kept for avatars, pills, progress tracks, scrollbar thumbs and the bottom-tab active pill. Borders are 1px everywhere. The only 2px lines are the selected-tab underline and the active-nav indicator, a 2px by 16px bar rounded on its right side. There are no clipped silhouettes or decorative geometry.

## Components

### Buttons
Tactile and quiet: they answer the press, not the hover.
- **Shape:** softly squared corners (8px). Three sizes: small (32px, 12px by 6px padding), medium (40px, 16px by 8px), large (48px, 24px by 12px). All reach 44px on touch and grow with their text.
- **Primary:** an Instrument White fill with `accent-ink` text, in the Control style. Hover moves to `accent-hover`.
- **Brand:** a Signal Red fill with white text, for the one key action on a screen.
- **Hover / Focus:** color, border and transform transitions run 150ms ease-out. A press scales to 0.98 in 75ms, with no scaling under reduced motion. Focus shows a 2px Instrument White ring offset 2px from the canvas. Disabled buttons drop to 50% opacity and ignore the pointer.
- **Secondary:** a Raised Panel fill with a hairline border. Hover moves to an Edge border on Lifted Panel.
- **Ghost:** Readout Grey text with no fill. Hover turns it Instrument White on Lifted Panel.
- **Danger:** Clay at a 10% fill and 30% border with Clay text. Hover raises the fill to 20%.
- **Icon button:** at least 44px square with 12px corners. It gives color-only feedback.

### Chips
- **Style:** 24px tall with 4px corners, 8px side padding and a 1px border, set in Geist Mono at 12px, uppercase, 0.05em.
- **State:** the default tone is Lifted Panel with Readout Grey text and an Edge border. Status tones use a 10% fill, a 40% border and full-strength text. The accent tone uses `accent-tint`.

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** Graphite Panel. The elevated variant runs a near-invisible tonal step from Raised Panel down to Graphite Panel.
- **Shadow Strategy:** Card by default, Card Large when elevated; see Elevation & Depth.
- **Border:** a 1px Hairline, or Edge on elevated cards.
- **Internal Padding:** 24px.
- **Interactive:** on hover the card lifts 2px, its border moves to Edge and the shadow grows to Card Large over 200ms ease-out. There is no lift under reduced motion.
- **Variants:** `bare` has no shadow. `glass` is for panels over textured backgrounds. `glow` is a neutralized legacy alias.

### Inputs / Fields
- **Style:** a recessed well. The canvas color (`bg`) sits inside a surface, with a 1px Hairline, 8px corners, 12px by 8px padding and 14px text. The compact `.inp` used in employer and admin forms is 40px tall with 12px corners.
- **Focus:** the border shifts to Instrument White. Other controls show the global focus ring: 2px Instrument White, offset 3px.
- **Labels:** `Field` wraps its control in a `<label>`, so the association is implicit. The label is Meta Grey at 12px, uppercase, 0.05em, and a hint follows in Faint Meta after a middle dot.
- **Error / Disabled:** no shared error treatment is defined yet.

### Navigation
- **Sidebar:** a 248px panel of strong glass. Groups collapse, with headers in Geist Mono at 10px, uppercase, 0.1em, Readout Grey. Items are 14px Readout Grey with 8px corners and 16px icons in Meta Grey. Hover adds a Graphite Panel fill and Instrument White text. The active item has an `accent-tint` fill, weight 500, an Instrument White icon and the 2px Signal Red bar at its left edge, and carries `aria-current="page"`. The active group expands automatically, and the open state of groups persists.
- **Search:** a 12px-cornered Raised Panel trigger with a `⌘K` hint opens the command palette, a strong-glass dialog with a 56px input row.
- **Mobile:** a sticky 56px glass header, a full-height drawer, and a 64px glass bottom bar with 10px mono labels. The active tab shows Instrument White text over a 28px by 48px Lifted Panel pill behind its icon.
- **Tabs:** underline tabs sit on a hairline, 44px tall. Inactive tabs are Meta Grey; the active tab is Instrument White at weight 500 with a 2px Signal Red underline. They follow the full WAI-ARIA keyboard model (arrows, Home, End, roving tabindex) and scroll horizontally on overflow.

### Dialogs
- **Shape and surface:** a native `<dialog>` in the top layer. The panel is at most 448px wide with 24px corners, strong glass, a hairline, Card Large and 24px padding.
- **Motion:** dialogs, search and the mobile menu share one critically damped spring (`UI_SPRING`: stiffness 400, damping 40, mass 1). Opening and closing follow the same path, and new input can reverse a transition in flight. Under reduced motion it becomes a 160ms ease-out fade.
- **Behavior:** `Modal` contains keyboard focus, closes on Escape, restores focus, and shares a scroll lock with nested dialogs. Initial focus goes to the element marked `data-autofocus`; confirmations start on Cancel. It is used only for blocking tasks.

### Stat & Metric Tiles
The instrument's readouts.
- **Stat:** 16px corners, 20px padding, a mono 11px label with an optional icon, and the value in the Metric style in its tone color. Toned stats add a 2px top bar in the tone. Trends show an arrow in Sage (up) or Clay (down).
- **Metric Tile:** a compact 16px-padded version whose value and label truncate.
- **Meter and progress:** an 8px fully rounded Lifted Panel track with a tone fill. Native `<progress>` uses the same Instrument White fill on Lifted Panel.

### LMS Workspace Patterns
- Selecting a lesson moves focus to the lesson heading, and outline progress moves with a transform rather than by animating width.
- Workspace navigation groups personal learning, training operations, people, and workspace settings. Organization and section live in the URL, so returning from a course restores context.
- Join, invitation, course, program and cohort creation forms open on request. They explain the course → program → cohort prerequisites where they matter. Current lists are searched in place, without a separate search screen.
- Role choices show names and descriptions beside a permission preview computed from the shared capability map. Scope and account status stay visible, and nothing suggests an organization role grants platform administration.
- Lesson authors preview current edits with the learner renderer before publishing. A quiz question comes before its answers and a direct correct-answer choice. Block actions meet the 44px target, and removal offers undo.
- Leaving an unsaved lesson always prompts, including through the shared LMS home link. In-memory drafts are scoped to the signed-in account, organization, course and lesson, and they survive internal navigation. Private lesson drafts are never written to localStorage or sessionStorage.
- Completing a course shows the saved progress and either a real next assigned course or a return to program progress. Assessment and certificate requirements stay explicit and separate.
- Local page search updates immediately. Only remote problem queries are debounced.

### Marketing Landing
A light-only page on Offer-Morning Paper, under `.landing-root`. The hero is set in Marketing Display, with Night-Shift Ink fading to 40% for the turn of phrase. Navigation links are pill outlines on a 15% ink border. A smooth-scroll layer (Lenis) and a WebGL ring backdrop sit behind the content; the backdrop loads lazily on the client inside a silent error boundary. A proof marquee loops every 42s and stops under reduced motion. The shared footer is pinned to paper inside the landing and follows the app theme everywhere else.

## Do's and Don'ts

### Do:
- **Do** use the token utilities (`bg-surface`, `border-edge`, `text-text-3`, `bg-brand`) so both themes and alpha modifiers keep working.
- **Do** give each screen at most one Signal Red action (`Button variant="brand"`); everything else is primary, secondary or ghost.
- **Do** separate with a 1px hairline and a tonal step first, and add the Card shadow only to cards and floating chrome.
- **Do** set headings with the role classes (`PageHeader` or `.type-display`, `.type-headline`, `.type-title`), not size and weight utilities.
- **Do** use Geist Mono for numbers, code, `kbd`, badges and stat labels.
- **Do** keep every touch target at least 44px and keep the themed focus ring (2px Instrument White, 3px offset).
- **Do** use the shared spring (`UI_SPRING`) for overlays and honor reduced motion, reduced transparency and increased contrast.
- **Do** render a page's failed main record with `LoadError`, which words 404, 403, 402 and network failures differently and only offers Retry when retrying can help.
- **Do** place an `AiUnavailable` notice above AI-backed actions and disable them when `useCapabilities()?.ai === false`, so learners learn the limit before they write anything. Treat `undefined` (loading, or an older API) as available.
- **Do** keep meta text on `text-3` and `text-4`; both are tuned to clear AA on every surface.
- **Do** animate `transform` and `opacity`. For progress, scale with a transform instead of transitioning width.

### Don't:
- **Don't** use neon (the retired lime `#E8FF47`), decorative gradients, colored shadows, glows or blur blobs.
- **Don't** set two Signal Red elements competing on one screen, or use red as decoration.
- **Don't** use weight 800 in the app; it belongs to the marketing display face.
- **Don't** hardcode hex colors in components; Clerk's `colorPrimary` is the only sanctioned literal.
- **Don't** use the Button `glow` prop, the Card `glow` variant, or `shadow-glow*` in new work; they are neutralized back-compat aliases.
- **Don't** add an eyebrow or kicker label above a heading; context belongs in the subtitle or in a badge in `PageHeader`'s `actions`.
- **Don't** put frosted glass on content cards; glass is for chrome over scrolling content.
- **Don't** fill a solid status color behind text; use a 10% tint with full-strength text.
- **Don't** put a colored side stripe on cards, callouts or alerts; the 2px active-nav bar is the only side indicator.
- **Don't** use bounce or elastic easing; motion decelerates like heavy machinery.
- **Don't** bring the landing's paper palette or Bricolage Grotesque into the authenticated app.
- **Don't** center everything or use decorative emoji.
