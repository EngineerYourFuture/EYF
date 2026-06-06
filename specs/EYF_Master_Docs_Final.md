# EYF — Engineer Your Future
# Master Pre-Build Documentation Suite — Version 1.0

> Single source of truth for every design, product, and technical decision. Claude Code reads this before writing any code.

---

## TABLE OF CONTENTS

**PART A — BRAND & DESIGN**
- Doc 01: Brand Book
- Doc 02: Design Philosophy & Rules
- Doc 03: Landing Page Scroll Story
- Doc 04: Design System Specification
- Doc 05: Wireframes — All Screens
- Doc 06: Motion & Animation Specification

**PART B — PRODUCT**
- Doc 07: Product Requirements Document (PRD)
- Doc 08: UX Flow Document
- Doc 09: Onboarding Flow Document

**PART C — TECHNICAL**
- Doc 10: System Requirements Document (SRD)
- Doc 11: Database Schema Document
- Doc 12: API Contract
- Doc 13: RBAC — Roles & Permissions

**PART D — OPERATIONS**
- Doc 14: Content Management Plan
- Doc 15: Monetisation & Billing Document
- Doc 16: Data & Analytics Plan
- Doc 17: Notification & Communication Plan
- Doc 18: Security & Compliance Document
- Doc 19: DevOps & Infrastructure Document
- Appendix: Claude Code System Prompt

---

# PART A — BRAND & DESIGN

---

## Doc 01: Brand Book

### 1.1 Foundation

**Mission:** Democratise placement preparation for every engineering student in India — regardless of college, city, or financial background.

**Vision:** A world where a student at a Tier 3 college in Patna has the same quality of placement preparation as a student at IIT Bombay.

**Brand Promise:** EYF doesn't just teach you. It trains you, tracks you, and gets you placed.

**Brand Personality:**
- **Honest** — We tell students what they don't want to hear, because that's what helps them
- **Relentless** — The platform adapts until they succeed
- **Cinematic** — A student's placement journey is the most important story of their year
- **Indian at heart** — Built for India's hiring patterns, colleges, and budget
- **Premium but accessible** — Looks like a ₹50,000 product. Costs ₹499.

### 1.2 Brand Voice

| Context | Tone | Example |
|---|---|---|
| Marketing / Landing | Bold, confrontational, honest | "You've been preparing. You're still not getting placed." |
| Onboarding | Warm, direct, encouraging | "Let's figure out exactly where you are and where you need to go." |
| Dashboard / App | Focused, functional, calm | "3 problems left to complete Pattern 7." |
| Error states | Human, never robotic | "Your submission failed — code exceeded memory limit (256MB). Optimise your space complexity." |
| Celebration | Genuine, not over-the-top | "You solved your first Hard problem. That's not luck — that's work." |
| Notifications | Direct, never pushy | "Your streak is at 14 days. One problem tonight keeps it alive." |

**Words We Use:** Path, Practice, Placed, Track, Solve, Drive, Your roadmap

**Words We Never Use:** Crush it, Hustle, Grind, Dominate, Unlock your potential, World-class, Revolutionary

---

### 1.3 Logo

- **Primary:** "EYF" in custom geometric letterforms — no serifs
- **Full name:** "Engineer Your Future" — regular weight below or beside wordmark
- **Clear space:** Minimum = height of the "E" on all sides
- **Minimum size:** 24px height digital, 10mm print

**Variants:**
```
Primary (dark bg):  EYF wordmark in #FAFAF9
Primary (light bg): EYF wordmark in #0A0A0A
Accent:             EYF wordmark in #E8FF47 — used sparingly
Monochrome:         Single colour only — no gradients on logo ever
```

**Never:** Stretch, distort, drop shadows, gradient fills, rotate, combine with other logos.

---

### 1.4 Colour System

**Primary Palette:**
```
--color-black:        #0A0A0A   /* Primary background (dark mode) */
--color-black-soft:   #111111   /* Surface background */
--color-black-border: #1C1C1C   /* Borders on dark */
--color-white:        #FAFAF9   /* Primary background (light mode) */
--color-white-soft:   #F5F5F4   /* Surface background (light) */
--color-white-border: #E7E5E4   /* Borders on light */
```

**Accent Palette:**
```
--color-electric:     #E8FF47   /* PRIMARY accent — electric yellow-green */
--color-electric-dim: #B8CC38   /* Hover state */
--color-electric-bg:  #1A1F00   /* Electric tinted background */
--color-danger:       #FF4500   /* Errors, urgency only */
--color-success:      #00FF87   /* Success states, streak celebration */
--color-warning:      #FFB020   /* Warnings, approaching limits */
```

**Text:**
```
--color-text-primary:   #FAFAF9   /* Dark mode headlines */
--color-text-secondary: #A1A1AA   /* Dark mode body */
--color-text-tertiary:  #52525B   /* Dark mode captions */
--color-text-inverse:   #0A0A0A   /* Light mode headlines */
```

**Semantic:**
```
--color-pro:    #818CF8   /* Pro plan indicator */
--color-elite:  #FBBF24   /* Elite plan indicator */
--color-easy:   #00FF87   /* Easy difficulty */
--color-medium: #FFB020   /* Medium difficulty */
--color-hard:   #FF4500   /* Hard difficulty */
--color-expert: #FF0080   /* Expert difficulty */
```

**Colour Usage Rules:**
1. Electric (#E8FF47) is the ONLY accent. Max 10% of any screen.
2. Never use purple, indigo, or blue as primary brand colours.
3. Dark mode is the default. Design dark-first.
4. No decorative gradients.

---

### 1.5 Typography

```css
font-family: 'Geist', 'Inter', system-ui, sans-serif;     /* Display */
font-family: 'Inter', system-ui, sans-serif;              /* Body */
font-family: 'JetBrains Mono', 'Fira Code', monospace;   /* Code */
```

**Type Scale:**
```
--text-display-2xl: clamp(64px, 9vw, 128px)   /* Hero headline */
--text-display-xl:  clamp(48px, 7vw, 96px)    /* Section headline */
--text-display-lg:  clamp(36px, 5vw, 72px)    /* Subsection headline */
--text-display-md:  clamp(28px, 4vw, 48px)    /* Feature headline */
--text-display-sm:  clamp(22px, 3vw, 36px)    /* Card headline */
--text-body-xl:     20px
--text-body-lg:     18px
--text-body-md:     16px
--text-body-sm:     14px
--text-body-xs:     12px
--text-code:        14px
```

**Weights:** 300 (display only), 400 (body), 500 (UI labels), 600 (subheadings), 700 (headings), 800 (display only)

**Line heights:** Display: 1.05–1.1 | Subheadings: 1.2–1.3 | Body: 1.6–1.7 | Code: 1.6

**Letter spacing:** Display XL+: -0.04em | Display MD-LG: -0.02em | Body: 0 | Caps: +0.08em

---

### 1.6 Spacing System (4px base)

```
--space-1: 4px    --space-2: 8px    --space-3: 12px   --space-4: 16px
--space-5: 20px   --space-6: 24px   --space-8: 32px   --space-10: 40px
--space-12: 48px  --space-16: 64px  --space-20: 80px  --space-24: 96px
--space-32: 128px --space-40: 160px --space-48: 192px --space-64: 256px
```

**Layout Grid:**
```
Desktop (1440px): 12 columns, 24px gutter, 80px margin
Laptop  (1280px): 12 columns, 20px gutter, 48px margin
Tablet   (768px): 8  columns, 16px gutter, 24px margin
Mobile   (375px): 4  columns, 16px gutter, 16px margin
```

---

### 1.7 Border Radius

```
--radius-none: 0px    --radius-sm: 4px    --radius-md: 8px
--radius-lg: 12px     --radius-xl: 16px   --radius-2xl: 24px
--radius-full: 9999px
```

### 1.8 Shadow System

```
--shadow-sm: 0 1px 2px rgba(0,0,0,0.5)
--shadow-md: 0 4px 12px rgba(0,0,0,0.4)
--shadow-lg: 0 8px 32px rgba(0,0,0,0.6)
--shadow-xl: 0 16px 48px rgba(0,0,0,0.8)
--shadow-electric: 0 0 24px rgba(232,255,71,0.3)
--shadow-glow-sm: 0 0 8px rgba(232,255,71,0.2)
```

### 1.9 Iconography

- **Library:** Lucide Icons (MIT license)
- **Sizes:** 16px (inline), 20px (UI actions), 24px (navigation), 32px (feature icons)
- **Stroke width:** 1.5px always — never filled icons
- **Custom:** Problem patterns, career tracks, certifications — custom SVG
- **Never:** Emoji as UI icons, filled/gradient icons, mixed libraries

---

## Doc 02: Design Philosophy & Rules

### 2.1 The 10 Inviolable Rules

**Rule 1: Dark mode is primary. Always.**
EYF is used at 11 PM by students grinding before a campus drive. Design for dark first.

**Rule 2: Typography does the work.**
A 96px headline needs no card, no border, no background. If you're adding graphic elements to make content feel important, the text is too small.

**Rule 3: One accent. One purpose.**
`#E8FF47` appears on: primary CTA, active nav states, streak counter, readiness score, key data highlights. Nowhere else.

**Rule 4: No decorative gradients.**
Only on progress bars (solid → transparent) and Three.js canvas backgrounds. Purple-to-blue is banned.

**Rule 5: No generic SaaS card grids.**
Features shown one at a time, with space, with detail, with proof. Not a 3-column grid of icon + title + 2-line description.

**Rule 6: Space is designed, not leftover.**
Empty space communicates confidence. Sections breathe. Never compress elements because it "looks more packed with value."

**Rule 7: Every animation has one job.**
Before any animation: "What does the user understand differently because of this motion?" No answer = remove it.

**Rule 8: The dashboard is Linear, not Notion.**
Marketing site = cinematic. Dashboard = functional clarity. Zero decorative elements inside the app.

**Rule 9: Error messages are written by humans.**
Every error has: what happened, why (when safe), what to do. Never "Something went wrong."

**Rule 10: Components look crafted, not generated.**
If it looks AI-generated, redesign it. Every pixel has a reason.

### 2.2 Design Benchmarks

| Reference | What to take |
|---|---|
| apple.com | Scroll storytelling, space, typography, one-thing-at-a-time |
| linear.app | Dashboard density, dark mode, interaction speed, keyboard nav |
| vercel.com | Hero restraint, monochrome discipline |
| stripe.com | Information architecture, component consistency |
| raycast.com | Dark mode mastery, power user UX |

### 2.3 Anti-Patterns — Never

```
✗ Purple/indigo/cyan gradients        ✗ Glass morphism / frosted glass
✗ Neon glow on everything             ✗ Bento grid feature layouts
✗ Floating orbs/blobs decoration      ✗ Star/sparkle emoji in UI
✗ Testimonial carousels               ✗ Sticky "🔥 Summer sale!" bars
✗ Loading spinners (use skeletons)    ✗ Modals for simple confirmations
✗ Disabled buttons with no reason     ✗ Red error on every field before typing
✗ "Premium" lock icons everywhere
```

---

## Doc 03: Landing Page Scroll Story

Total scroll: ~800vh. Nine scenes. One idea per scene.

### Scene 1 — THE CONFRONTATION (0–8% scroll)

```
Background: #0A0A0A
Effect: Subtle particle field (Three.js, 200 particles, #1C1C1C, very slow)
Navigation: Hidden, appears after 1s

Copy (word by word, 0.08s per word):
  "You've been preparing."
  [pause 0.8s]
  "You're still not getting placed."

Typography:
  Geist, clamp(40px, 7vw, 72px), weight 300
  Line 1: #FAFAF9
  Line 2: #A1A1AA (softer — a quiet truth)
  Letter-spacing: -0.03em

No CTA. No button. Just the statement.
Scroll indicator: thin 40px vertical line, pulsing at bottom center.
```

### Scene 2 — THE DIAGNOSIS (8–18%)

```
Background: fades to #0D0D0D
Three stats appear one at a time on scroll:

Stat 1 (at 10%): "300 problems solved."
Stat 2 (at 13%): "0 offers received."
Body (at 15%): "Most students don't fail because they don't work hard.
                They fail because they prepare without direction."

Typography:
  Stats: Geist, 96px, numbers in #E8FF47, text in #FAFAF9
  Body: Inter, 20px, #71717A

Animation: each stat fades + slides up 20px, 0.6s
```

### Scene 3 — THE REVEAL (18–25%)

```
EYF wordmark assembles from 40 SVG strokes (1.2s total)
Below types character by character: "Engineer Your Future."
Then: "India's first placement operating system."
Electric line sweeps left-to-right under "Engineer Your Future." (200ms)

Typography:
  "EYF": 200px, Geist, #FAFAF9
  "Engineer Your Future.": 48px, Geist, weight 300
  "India's first...": 18px, Inter, #A1A1AA
```

### Scene 4 — THE MAP (25–40%)

```
3D roadmap unfolds as user scrolls (React Three Fiber)
Nodes: Assessment → Roadmap → DSA → Core Subjects → Cognitive Games
       → Mock Interviews → Resume → Jobs → Offer

Camera travels the path as user scrolls (GSAP ScrollTrigger scrub: 1)
Nodes light up in #E8FF47 as camera passes

Left pinned text:
  "Most platforms give you content."
  "EYF gives you a path."
  "Every student starts with a skill assessment.
   Every roadmap is generated for your timeline,
   your target company, and your exact gaps."

Nodes are clickable → tooltip showing module contents
```

### Scene 5 — THE PROOF (40–52%)

```
Horizontal pinned scroll section
8 student panels: photo + college + arrow + company logo

  Rahul · VIT Bhopal → Amazon SDE-1
  Priya · JNTU Hyderabad → Razorpay
  Mohammed · LNCT Bhopal → Flipkart
  Sneha · PCCoE Pune → Swiggy
  Arjun · AKTU Lucknow → CRED
  Divya · SRM Chennai → Juspay
  Karan · MIT Pune → Zepto
  Anjali · BNMIT Bangalore → Freshworks

Stat bar below:
  "73% of EYF users who complete their track get placed within 3 months"
  73% in #E8FF47, rest in #FAFAF9
```

### Scene 6 — THE FEATURES (52–76%) — 4 sub-scenes, 6% each

**Feature 1 (52–58%): DSA Engine**
```
Visual: 3D binary tree rotating in right half (React Three Fiber)
Left text:
  "Pattern-based. Not problem-based."
  "EYF organises 2,000+ problems into 15 core patterns."
  "After every solution, we generate 3 variants."
Stat: "15 patterns cover 92% of all Indian OA questions" in electric
```

**Feature 2 (58–64%): Cognitive Games**
```
Visual: Simulated TCS NQT interface (real component renders)
Left text:
  "The round that eliminates 80% of students."
  "EYF simulates TCS NQT, AMCAT, Mettl with exact interface and timing."
Red countdown: "14 minutes remaining" — visceral urgency
```

**Feature 3 (64–70%): AI Mock Interview**
```
Visual: Waveform animation, voice input, split feedback panel
Left text:
  "Practice until the pressure disappears."
  "Your anxiety index drops over 4 weeks of practice."
Stat: "Average anxiety index: 29 → 8 in 4 weeks"
```

**Feature 4 (70–76%): Career Tracks**
```
Visual: 12 role cards fan out in 3D
Left text:
  "Your role. Your curriculum. Your companies."
  "EYF gives every student a week-by-week curriculum
   built for their exact target role."
```

### Scene 7 — THE COMPARISON (76–84%)

```
Split screen, divider in center

LEFT — "Before EYF":
  LeetCode, GFG, YouTube, Telegram, PDF, Notion — scattered, overlapping
  Label: "Average student: 6 platforms, 0 direction"

RIGHT — "EYF":
  Single clean path (the roadmap)
  Label: "EYF: One path. From first concept to first offer."

Animation: After 2s, left side chaos collapses and organises into EYF roadmap
```

### Scene 8 — PRICING (84–92%)

```
Copy above:
  "Two months of EYF Pro.
   Less than one day of offline coaching.
   More effective than both."

Three plan tiles (Basic | Pro | Elite)
Pro slightly larger, electric border

Annual toggle prominently at top (annual pre-selected)

Anchor line below:
  "Offline coaching: ₹1,20,000 · LeetCode: ₹35,000/year · EYF Pro: ₹3,999/year"
```

### Scene 9 — THE FINAL CTA (92–100%)

```
Near-black, full viewport
Particle field from Scene 1 — slightly faster (urgency)

Large (96px, Geist Light):
  "What's the cost
   of not starting
   today?"

Below (Inter, 18px, #71717A):
  "14,847 students are currently preparing on EYF.
   Some of them are competing for the same roles you are."

BUTTON: "Start your path →"
  bg: #E8FF47, text: #0A0A0A
  size: 18px, padding: 16px 40px, border-radius: 8px
  hover: scale(1.02), shadow-electric glow

Below button (13px, #52525B):
  "No credit card required · Cancel anytime · Free tier available"
```

### Navigation Behaviour

```
Landing page:
  On load: transparent
  After 400px scroll: rgba(10,10,10,0.85) + backdrop-blur(16px)
  Height: 64px
  Left: EYF wordmark
  Right: "Sign in" (ghost) + "Get started" (#E8FF47 button)

Dashboard:
  Left sidebar: 240px expanded, 64px collapsed
  Top bar: breadcrumb + search + notifications + avatar
```

---

## Doc 04: Design System Specification

### 4.1 Button Component

```
Variants: primary | secondary | ghost | danger
Sizes: sm (32px) | md (40px) | lg (48px) | xl (56px)

PRIMARY:
  bg: #E8FF47, text: #0A0A0A
  hover: scale(1.02), bg: #D4E832
  active: scale(0.98)
  disabled: opacity-30

SECONDARY:
  bg: transparent, text: #FAFAF9, border: 1px solid #1C1C1C
  hover: bg: #111111

GHOST:
  bg: transparent, text: #A1A1AA
  hover: text: #FAFAF9, bg: #111111

DANGER:
  bg: transparent, text: #FF4500, border: 1px solid #FF4500
  hover: bg: rgba(255,69,0,0.1)

States: loading (spinner), success (check replaces icon)
```

### 4.2 Input Component

```
Height: 40px (md), 48px (lg)
Background: #111111
Border: 1px solid #1C1C1C (default), #E8FF47 (focus), #FF4500 (error)
Text: #FAFAF9, placeholder: #52525B
Border-radius: 8px, padding: 12px 16px
Font: Inter 16px

Phone OTP: 6 individual 48px squares
Password: always show/hide toggle
```

### 4.3 Card Patterns

```
NO GENERIC CARDS. Three allowed patterns:

PROBLEM ROW (problem list):
  Full-width horizontal row
  Left: difficulty dot, number, title
  Right: tags, acceptance rate, company logos (small)
  Separated by 1px borders — no rounded corners

MENTOR CARD:
  Avatar 48px circle | Name, company, role | Rating, price
  Border: 1px solid #1C1C1C
  Hover: border-color #E8FF47

STAT CARD (dashboard):
  Large number: Geist 48px, electric or white
  Label: Inter 14px, #71717A
  Background: #111111, no border, no shadow
```

### 4.4 Code Editor

```
Base: Monaco Editor
Custom EYF Dark theme:
  Background: #0D0D0D
  Line numbers: #3F3F46
  Current line highlight: #111111
  Selection: #E8FF4720
  Keywords: #E8FF47
  Strings: #00FF87
  Comments: #52525B
  Functions: #818CF8
  Numbers: #FBBF24

Layout:
  Left panel (40%): Problem description (markdown)
  Right panel (60%): Editor
  Bottom drawer: Test cases, console, submission results
  Toolbar: Language selector | Run | Submit | Hints | Timer
```

### 4.5 Sidebar Navigation

```
Width: 240px expanded, 64px collapsed
Background: #0A0A0A, border-right: 1px solid #1C1C1C

Item height: 40px
Icon (20px) + label (Inter 14px Medium)
Active: bg #E8FF4710, left border 2px #E8FF47, text #E8FF47
Hover: bg #111111
Inactive: text #71717A

Items (in order):
  🏠 Dashboard    💻 Problems     🗺️ Roadmap      📊 Assessments
  🎤 Mock         🎮 Cognitive    💼 Jobs         📄 Resume
  🤝 Mentorship   💬 Community    🏆 Certifications
  ──────────────
  ⚙️ Settings     ❓ Help
```

### 4.6 Difficulty Badges

```
Easy:   bg #00FF8720, text #00FF87, border 1px #00FF8740
Medium: bg #FFB02020, text #FFB020, border 1px #FFB02040
Hard:   bg #FF450020, text #FF4500, border 1px #FF450040
Expert: bg #FF008020, text #FF0080, border 1px #FF008040
Font: Inter 12px semibold, letter-spacing +0.04em
Border-radius: 4px, padding: 2px 8px
```

### 4.7 Progress Elements

```
STREAK COUNTER:
  Number: Geist 72px, #E8FF47
  Label: Inter 16px, #71717A
  Fire emoji: 32px (only emoji permitted in UI)

READINESS SCORE RING:
  SVG circular progress, 120px diameter
  Track: #1C1C1C, Progress: #E8FF47
  Center: percentage Geist 36px
  Label: company name Inter 14px #71717A

HEATMAP (GitHub-style):
  Cell: 12px, gap: 3px, radius: 2px
  Colours: #1C1C1C | #E8FF4730 | #E8FF4760 | #E8FF47
```

### 4.8 Toast / Notifications

```
Position: bottom-right, width: 360px
Background: #111111, border: 1px solid #1C1C1C
Border-radius: 12px, padding: 16px, shadow: --shadow-lg

Left accent border (4px):
  Success: #00FF87  Error: #FF4500  Warning: #FFB020  Info: #818CF8

Animation: slide in from right (Framer Motion)
Auto-dismiss: 4s
```

---

## Doc 05: Wireframes — All Screens

### Screen Inventory

```
MARKETING:
  M-01 Landing (scroll film)       M-02 Pricing
  M-03 Career tracks overview      M-04 About
  M-05 Blog / Placement stories    M-06 Salary database (public)
  M-07 Sign in                     M-08 Sign up / Onboarding

DASHBOARD:
  D-01 Home dashboard              D-02 Streak & activity

PROBLEMS:
  P-01 Problem list                P-02 Problem detail + editor
  P-03 Submission result           P-04 Editorial
  P-05 Problem variants

ROADMAP:
  R-01 Roadmap overview            R-02 Day detail
  R-03 30-day sprint mode          R-04 Career track selector
  R-05 Track detail

ASSESSMENT:
  A-01 Assessment intro            A-02 In-progress
  A-03 Results / gap report        A-04 Probability dashboard

MOCK INTERVIEWS:
  MI-01 Mock home                  MI-02 AI mock (in session)
  MI-03 Peer mock (in session)     MI-04 Expert booking
  MI-05 Feedback report            MI-06 Replay theater

COGNITIVE GAMES:
  CG-01 Games home                 CG-02 Session in-progress
  CG-03 Results + analytics

CORE SUBJECTS:
  CS-01 Subject selector           CS-02 Theory page
  CS-03 Q&A practice               CS-04 SQL editor

RESUME:
  RB-01 Resume builder             RB-02 ATS report
  RB-03 Template selector

JOBS & INTERNSHIPS:
  IJ-01 Job board                  IJ-02 Internship board
  IJ-03 Application tracker        IJ-04 Drive calendar

MENTORSHIP:
  ME-01 Marketplace                ME-02 Mentor profile
  ME-03 Booking flow               ME-04 Session page
  ME-05 Feedback submission

COMMUNITY:
  CO-01 Experience feed            CO-02 Submit experience
  CO-03 Discussion forums          CO-04 Accountability pods

CERTIFICATIONS:
  CE-01 Certs home                 CE-02 Certificate detail
  CE-03 Purchase flow              CE-04 Public verification

ACCOUNT:
  AC-01 Settings                   AC-02 Billing
  AC-03 Profile                    AC-04 Notification preferences
```

### Key Screen Wireframes

#### D-01: Home Dashboard

```
┌──────────────────┬───────────────────────────────────────────────┐
│ SIDEBAR (240px)  │ TOP BAR: [breadcrumb] [search] [🔔] [avatar]  │
│                  ├───────────────────────────────────────────────┤
│ 🏠 Dashboard     │ "Good evening, Rahul."          "Day 14 🔥"   │
│ 💻 Problems     ├───────────────────────────────────────────────┤
│ 🗺️ Roadmap       │ STAT ROW (4 cards)                            │
│ 📊 Assessments  │ [Problems 247↑] [Streak 14d] [Flipkart 74%] [8]│
│ 🎤 Mock         ├───────────────────────────────────────────────┤
│ 🎮 Cognitive    │ TODAY'S ROADMAP (pinned)                       │
│ 💼 Jobs         │ Day 14 · Sliding Window                        │
│ 📄 Resume       │ [Concept] [3 problems] [1 revision]            │
│ 🤝 Mentorship   │ ████████░░ 2/3 complete                        │
│ 💬 Community    ├───────────────────────────────────────────────┤
│ 🏆 Certs        │ [Activity Heatmap              ] [Leaderboard] │
│ ─────────────   ├───────────────────────────────────────────────┤
│ ⚙️ Settings      │ DRIVE ALERT (if drive < 30 days)              │
│ ❓ Help          │ "Amazon drive in 23 days · 74% ready"         │
│                  │ [Start sprint]    [View prep track]            │
└──────────────────┴───────────────────────────────────────────────┘
```

#### P-02: Problem Detail + Code Editor

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Problems | "Two Sum" | ● Medium | Amazon ×3 Google ×2         │
├──────────────────────────┬──────────────────────────────────────┤
│ PROBLEM PANEL (40%)      │ EDITOR PANEL (60%)                   │
│                          │                                       │
│ [Description] [Solution] │ [Python ▾]  [▶ Run]  [✓ Submit]     │
│ [Submissions] [Hints]    │ [Timer: 45:00]                        │
│                          │ ┌─────────────────────────────────┐  │
│ Given an array of        │ │ 1  def twoSum(self, nums, t):   │  │
│ integers nums and an     │ │ 2    |                          │  │
│ integer target...        │ │                                 │  │
│                          │ └─────────────────────────────────┘  │
│ Examples:                │                                       │
│ Input: [2,7,11], 9       │ ─── TEST CASES DRAWER ───────────    │
│ Output: [0,1]            │ Case 1: [2,7,11,15], 9 → [0,1]       │
│                          │ Case 2: [3,2,4], 6   → [1,2]         │
│ Constraints:             │ [+ Add custom case]                   │
│ 2 ≤ n ≤ 10⁴             │                                       │
│                          │                                       │
│ [Hash Map] [Array]       │                                       │
│ Amazon  Google  Adobe    │                                       │
│ [▶ Open Visualizer]      │                                       │
└──────────────────────────┴──────────────────────────────────────┘
```

#### A-03: Assessment Results

```
┌─────────────────────────────────────────────────────────────────┐
│ SKILL ASSESSMENT RESULTS                                         │
│ "Here's exactly where you stand."                                │
├─────────────────────────────────────────────────────────────────┤
│ YOUR TARGETS:                                                     │
│ ✅ Realistic now:    Freshworks, Juspay, Chargebee               │
│ 🎯 Stretch (8 mo):  Flipkart, Meesho, Swiggy                    │
│ 🏆 Dream (18 mo):   Amazon, Google, Microsoft                    │
├─────────────────────────────────────────────────────────────────┤
│ SKILL HEATMAP:                                                    │
│ Arrays       ████████░░  78%  STRONG                             │
│ Strings      ██████░░░░  61%  GOOD                               │
│ Trees        █████░░░░░  52%  NEEDS WORK                         │
│ Graphs       ██░░░░░░░░  24%  ⚠ CRITICAL GAP                    │
│ Dynamic Prog ███░░░░░░░  31%  ⚠ CRITICAL GAP                    │
│ DBMS         ████████░░  76%  STRONG                             │
│ OS           █████░░░░░  54%  NEEDS WORK                         │
│ Aptitude     ████░░░░░░  42%  NEEDS WORK                         │
├─────────────────────────────────────────────────────────────────┤
│ "At 2 hours/day, you'll be ready for Flipkart in 14 weeks."     │
│ [View your roadmap →]                    [Adjust timeline]        │
└─────────────────────────────────────────────────────────────────┘
```

#### MI-02: AI Mock Interview (In Session)

```
┌─────────────────────────────────────────────────────────────────┐
│ AMAZON SDE-1 MOCK INTERVIEW              Timer: 42:18 ███████░░ │
├──────────────────────────────────────────┬──────────────────────┤
│ INTERVIEWER PANEL                        │ CODE PANEL           │
│                                          │                      │
│ "Let's start with a coding problem.      │ [Python ▾]           │
│  Given a binary tree, return the         │                      │
│  level-order traversal."                 │  def levelOrder...   │
│                                          │                      │
│ ──────────────────────────────────────   │                      │
│ YOUR RESPONSE:                           │                      │
│ [Voice waveform ████████████]            │                      │
│ OR [Type your response...]               │                      │
│                                          │                      │
│ [🔍 Get hint — costs 10 XP]             │                      │
│                                          │                      │
│ Round 1 of 3 · Technical                 │                      │
│ Speaking time: 4m 20s                    │                      │
└──────────────────────────────────────────┴──────────────────────┘
```

---

## Doc 06: Motion & Animation Specification

### 6.1 Animation Principles

- **Physics-based:** Framer Motion springs, not cubic-bezier curves
- **Purposeful:** Every animation answers: "What does user understand differently?"
- **Fast for UI, slow for story:** Nav: 150–200ms. Landing scroll: 600–1200ms
- **Reduced motion:** All animations respect `prefers-reduced-motion`

### 6.2 Standard Durations

```
--duration-instant: 0ms      /* State changes (toggle) */
--duration-fast:    150ms    /* Hover, small UI */
--duration-normal:  300ms    /* Element appearances */
--duration-slow:    500ms    /* Cards, panels */
--duration-xslow:   800ms    /* Feature reveals */
--duration-story:   1200ms   /* Landing hero */
```

### 6.3 Standard Easings

```
--ease-default: cubic-bezier(0.16, 1, 0.3, 1)   /* Fast out, slow settle */
--ease-spring:  spring(1, 90, 12, 0)             /* Framer Motion spring */
--ease-bounce:  spring(0.5, 100, 8, 10)          /* Celebratory */
--ease-in:      cubic-bezier(0.4, 0, 1, 1)       /* Exit */
--ease-out:     cubic-bezier(0, 0, 0.2, 1)       /* Enter */
```

### 6.4 Specific Animation Specs

**Page transitions:** Fade + 8px vertical slide, 300ms, ease-out

**Dashboard cards on load:** Stagger 60ms, opacity 0→1, y: 12px→0, 400ms

**Problem solved (celebration):**
1. Verdict text scales in: scale(0.8)→1, 200ms, spring
2. XP counter counts up: 500ms
3. Streak flame pulses: scale 1→1.3→1, 600ms
4. Streak milestone: canvas-confetti, 2s

**Streak counter number change:** CSS 3D rotateX flip, 400ms, upward direction

**Skill assessment bars:** 0 → final value, stagger 100ms, 800ms each. Critical gaps pulse once after appearing.

**Code submit flow:** Button scale 0.95 + spinner → result slides up from panel

**Landing page (GSAP ScrollTrigger):** scrub: 1 (smooth). Three.js camera lerp: 0.05. Particle field: deltaTime-based movement.

**Readiness score ring:** SVG stroke-dashoffset 0 → value, 1200ms ease-out, number counts up simultaneously.

# PART B — PRODUCT

---

## Doc 07: Product Requirements Document (PRD)

### 7.1 Product Overview

**Product:** EYF (Engineer Your Future) | **Type:** B2C SaaS — Placement Prep Platform
**Primary metric:** Students placed per month
**Secondary:** DAU, readiness score improvement, mock interview completion rate

### 7.2 User Personas

**Rahul (Primary):** 3rd year B.Tech CSE, Tier 2 college, targets product company, 2–3 hrs/day, primarily mobile at night. Pain: doesn't know what to study. Goal: first product company job in 6 months.

**Priya (Secondary):** Final year, campus drive in 8 weeks, 4–5 hrs/day, high stress. Pain: starting too late. Goal: any offer before graduation.

**Arjun (High LTV):** Working professional, 2 YOE Infosys, targets Flipkart/Swiggy, 1–1.5 hrs/day weekdays. Pain: rusty DSA, doesn't know product interview format. Goal: job switch in 4 months.

---

### 7.3 Feature Requirements

#### Auth & User Management
- **US-AUTH-01:** Sign up with Google OAuth in under 30 seconds
- **US-AUTH-02:** Sign up with Indian phone + OTP (MSG91, within 5s, 6-digit, 5-min expiry)
- **US-AUTH-03:** Session persists across browser restarts (httpOnly refresh token, 30-day validity)
- **US-AUTH-04:** Free tier shows exactly what each paid feature does before paywall hit

#### Onboarding
- **US-ON-01:** 4-step onboarding in under 3 minutes (name/college/year, track, timeline, assessment)
- **US-ON-02:** Gap report and generated roadmap shown within 5s of assessment completion
- **US-ON-03:** Skip assessment option with Day 3 re-prompt

#### DSA Engine
- **US-DSA-01:** Browse problems filtered by pattern, difficulty, company, topic (multi-select, URL-persistent)
- **US-DSA-02:** Solve in Monaco editor (C++, Java, Python, JS). Code persists on refresh.
- **US-DSA-03:** Submission result within 5s (P95). Judge0, Docker-isolated, 2s CPU, 256MB limit.
- **US-DSA-04:** 2–3 AI-generated variants shown after solving (Claude API, within 2s)
- **US-DSA-05:** 2D visualizer for any algorithm (D3.js, step-by-step, speed control, custom input)
- **US-DSA-06:** Free tier: hard 5 submissions/day limit with upgrade prompt on hit

#### Skill Assessment
- **US-AS-01:** Adaptive MCQ (harder on correct, easier on wrong). 20 questions: 12 DSA + 4 CS + 4 aptitude
- **US-AS-02:** 25-minute timed, no pause
- **US-AS-03:** Gap report shows Realistic / Stretch / Dream company tiers with probability
- **US-AS-04:** Placement probability score updates weekly (every Sunday midnight)

#### Career Tracks
- **US-CT-01:** 12 career tracks on visual selector (role icon, salary range, demand, time estimate)
- **US-CT-02:** Week-by-week curriculum per track (concept + problems + project task + company context)
- **US-CT-03:** Switch tracks without losing DSA progress (10-min re-calibration on switch)

#### Core Subjects
- **US-CS-01:** Theory notes for all 6 subjects (OS, DBMS, CN, OOPs, System Design, COA)
- **US-CS-02:** Flashcard Q&A with spaced repetition (SM-2 algorithm)
- **US-CS-03:** In-browser SQL editor (sql.js SQLite, pre-loaded schemas, auto-format)

#### Cognitive Games
- **US-CG-01:** 8 game types with company simulations (TCS NQT, AMCAT, Mettl, HirePro)
- **US-CG-02:** Full-screen enforced (3 ESCs = session flagged, data saved)
- **US-CG-03:** Copy-paste disabled (JS event listeners, right-click disabled)
- **US-CG-04:** Anxiety index calculated and tracked across sessions

#### Mock Interviews
- **US-MI-01:** AI mock for any target company + round type (Claude API + Whisper voice input)
- **US-MI-02:** Detailed feedback report within 60 seconds (6 dimensions, 0–100 each)
- **US-MI-03:** Peer mock matched within 24 hours (Agora WebRTC + shared Monaco via WebSockets)
- **US-MI-04:** Expert mock booking with Razorpay payment

#### Resume Builder
- **US-RB-01:** JSON schema → PDF via react-pdf. Live preview updates within 300ms.
- **US-RB-02:** ATS score within 3 seconds on JD paste. Keyword gaps + format issues listed.
- **US-RB-03:** ATS-parseable PDF export (no graphics, no tables, standard fonts)

#### Mentorship
- **US-ME-01:** Browse mentors filtered by company, role, expertise, price, availability
- **US-ME-02:** Book and pay within platform (Razorpay)
- **US-ME-03:** Mentor earns 80%, paid weekly via Razorpay Connect

#### Jobs & Internships
- **US-JB-01:** Jobs filtered by career track, experience, location. Refreshed daily.
- **US-JB-02:** Off-campus drive alerts: push + WhatsApp within 30 minutes of match
- **US-JB-03:** Kanban application tracker (Saved → Applied → OA → Tech → HR → Offer → Rejected)

#### Certifications
- **US-CERT-01:** Certificate generated within 5 seconds of purchase. Verification URL public.
- **US-CERT-02:** One-click LinkedIn add via LinkedIn OAuth

---

### 7.4 Non-Functional Requirements

| Requirement | Target |
|---|---|
| FCP (4G mobile India) | < 1.5s |
| Code submission result | < 5s (P95) |
| API P95 latency | < 300ms |
| Uptime | 99.9% |
| Minimum screen width | 375px |
| Accessibility | WCAG 2.1 AA |
| Default mode | Dark mode |

---

## Doc 08: UX Flow Document

### Journey 1: New User → First Problem Solved (Target: < 10 min)

```
Landing page
→ Click CTA → Google OAuth (1 click)
→ Onboarding: name/college/year → track → timeline
→ Assessment prompt → Skip OR Take
→ IF SKIP: Dashboard → Today's challenge → Problem page → Solve → Submit
→ XP animation → Variant shown
TOTAL: 8–12 minutes
```

### Journey 2: Free User → Paid User (Target: < 3 min from wall)

```
Hits 5 submission limit mid-debug
→ "You've hit your daily limit" screen
→ NOT generic — specific: "You solved 4 problems today.
   Pro removes this limit. At your pace, you'd solve 8/day on Pro."
→ Plan comparison (Basic vs Pro, Pro highlighted)
→ Annual pre-selected (₹3,999/year)
→ Razorpay payment (UPI prominent)
→ Payment success → confetti
→ "You now have unlimited submissions. Keep going."
→ Returns to exact problem user was on
```

### Journey 3: Assessment → Roadmap → Day 1

```
Take Assessment (25 min)
→ Results: gap heatmap + company calibration
→ "Your roadmap is ready" CTA
→ Roadmap overview: 12-week plan
→ Day 1: "Two Pointers — Introduction"
→ Concept note (5 min read) → First problem: Two Sum (Easy)
→ First submission → success
→ Streak starts: "Day 1 🔥"
```

### Journey 4: Expert Mock Booking

```
Dashboard → Mock Interviews → Expert Mock tab
→ Browse mentors filtered by target company (Amazon)
→ Select mentor (4.8★, 3 YOE Amazon SDE-2)
→ Mentor profile → select slot: "Thursday 8 PM"
→ Select type: "Technical Round (DSA)"
→ Payment: ₹499 OR "Use 1 included session" (Elite)
→ Razorpay → UPI → Booking confirmed
→ Calendar invite via email
→ Reminders: 7 AM + 7:45 PM on session day
→ Session: Agora video + shared editor
→ Post-session: feedback form required to release mentor payment
→ Report delivered within 2 hours
```

---

## Doc 09: Onboarding Flow Document

### Step 0: Landing → Sign Up
```
Trigger: any CTA click
Destination: /sign-up (Clerk)
Options: Google OAuth | Phone OTP
Post-auth: → /onboarding/step-1
```

### Step 1: Basic Profile (60s target)
```
Fields: First name, College (searchable 500+ colleges), Graduation year, Branch
Progress: 1 of 3
Skip: NOT available
CTA: "Continue" in electric yellow
```

### Step 2: Career Track (30s target)
```
Header: "What role are you targeting?"
Grid: 12 track cards (4×3 desktop, 2×6 mobile)
Each card: icon + title + "Most hired at: [2-3 companies]"
Popular badge: Backend, Full Stack, GenAI
"Not sure?": → General Placement Prep (uses Backend as base)
Selected state: electric border + checkmark
Progress: 2 of 3
```

### Step 3: Timeline (20s target)
```
Header: "When is your target date?"
Radio options (large, not dropdown):
  ○ "Campus drive in 1–3 months" (urgent sprint)
  ○ "3–6 months" (standard)
  ○ "6–12 months" (full depth)
  ○ "I'm a working professional"
CTA: "Finish setup"
Progress: 3 of 3
```

### Step 4: Assessment Prompt
```
Header: "Before we build your roadmap, take a quick assessment."
[Take 20-min assessment now] — electric (recommended)
[Skip — I'll do this later]  — ghost

Copy: "73% of placed EYF users completed this on their first day."

IF SKIP: → Dashboard, assessment prompt in sidebar
IF TAKE: → /assessment/start
```

### Post-Assessment: Roadmap Generation
```
Loading: "Building your personalised roadmap..." (2s)
Animation: roadmap nodes assembling (2s Three.js)

Results page (staggered reveal):
1. Gap heatmap
2. Company calibration (Realistic / Stretch / Dream)
3. Roadmap preview (first 7 days)
4. CTA: "Start Day 1" → Day 1 concept + first problem
```

### Day 1 Email (sent 2 hours after signup)
```
Subject: "Your EYF roadmap is ready, [Name]"
Content: top 3 gaps + Day 1 task + "14,000 students started exactly where you are"
CTA: "Start Day 1 →" deep links to Day 1 problem
```

---

# PART C — TECHNICAL

---

## Doc 10: System Requirements Document (SRD)

### 10.1 Performance Requirements

| Metric | Target |
|---|---|
| FCP (4G mobile India) | < 1.5s |
| LCP | < 2.5s |
| TTI | < 3.5s |
| CLS | < 0.1 |
| API P50 | < 100ms |
| API P95 | < 300ms |
| Code submission (P95) | < 5s |
| DB query P95 | < 50ms |
| Initial bundle gzipped | < 200KB |

### 10.2 Scalability Stages

| Stage | MAU | Concurrent | Stack |
|---|---|---|---|
| Launch | 5,000 | 200 | Vercel free + 1 Railway + Neon free |
| Growth | 50,000 | 2,000 | Vercel Pro + 3 Railway + Neon Launch |
| Scale | 5,00,000 | 20,000 | Multi-region + dedicated DB + K8s |

### 10.3 Availability

```
Target: 99.9% uptime (43.2 min/month downtime allowed)
Maintenance window: Sundays 2–4 AM IST
RTO: < 1 hour | RPO: < 15 minutes (Neon point-in-time)
Status page: status.eyf.in (BetterUptime)
```

### 10.4 Browser & Device Support

```
Browsers: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
Mobile: Android 8+ (Chrome), iOS 13+ (Safari)
Minimum: 375px width (iPhone SE)
Monaco editor: desktop-optimised, mobile shows read-only + "Open on desktop"
Three.js: graceful degradation on low-end (static image fallback)
```

### 10.5 Tech Stack Rationale

```
Next.js 14 (App Router):
  SSR for SEO — problem pages and salary data pages must be indexed
  RSC reduces client JS for content pages

PostgreSQL via Neon:
  Serverless, generous free tier, point-in-time recovery

Prisma ORM:
  Type-safe, migration management, excellent DX

Redis via Upstash:
  Serverless, pay-per-request early stage, no always-on cost

Clerk (Auth):
  Phone OTP critical for India — Clerk supports it natively
  SOC 2 certified, handles sessions, MFA, SSO

Judge0 on Hetzner:
  Must be isolated from app servers (security critical)
  Self-hosted CX21 (€5.83/month)

Claude API:
  claude-sonnet-4-5 for complex (interview analysis, AI tutor)
  claude-haiku-4-5 for simple (basic hints, MCQ feedback)
```

---

## Doc 11: Database Schema Document

### Complete Prisma Schema

```prisma
// ─── USERS ───────────────────────────────────────────────────

model User {
  id             String   @id @default(cuid())
  clerkId        String   @unique
  email          String   @unique
  phone          String?
  name           String
  college        String?
  graduationYear Int?
  branch         String?
  targetRole     String?
  cgpa           Float?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  profile        UserProfile?
  subscription   Subscription?
  solutions      ProblemSolution[]
  streaks        DailyStreak[]
  userRoadmaps   UserRoadmap[]
  assessments    AssessmentSession[]
  mockSessions   MockSession[]       @relation("Interviewee")
  mentorProfile  Mentor?
  bookings       Booking[]           @relation("StudentBookings")
  certificates   Certificate[]
  projects       UserProject[]
  xpLogs         XPLog[]
  notifications  Notification[]
  subCounts      DailySubmissionCount[]

  @@index([email])
  @@index([clerkId])
}

model UserProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  avatar          String?
  bio             String?
  githubUrl       String?
  linkedinUrl     String?
  leetcodeHandle  String?
  currentXP       Int      @default(0)
  totalXP         Int      @default(0)
  level           Int      @default(1)
  currentStreak   Int      @default(0)
  longestStreak   Int      @default(0)
  anxietyIndex    Float?
  lastActive      DateTime?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Subscription {
  id              String    @id @default(cuid())
  userId          String    @unique
  planId          String    // free | basic | pro | elite
  status          String    // active | cancelled | expired | past_due
  billingPeriod   String    // monthly | annual
  startDate       DateTime
  endDate         DateTime?
  razorpaySubId   String?
  cancelledAt     DateTime?
  createdAt       DateTime  @default(now())

  user User @relation(fields: [userId], references: [id])
  @@index([userId])
  @@index([status])
}

// ─── DSA ENGINE ──────────────────────────────────────────────

model Problem {
  id             String   @id @default(cuid())
  title          String
  slug           String   @unique
  difficulty     String   // beginner | easy | medium | hard | expert
  description    String   @db.Text
  constraints    String   @db.Text
  examples       Json     // [{input, output, explanation}]
  topics         String[]
  patterns       String[]
  companies      String[]
  acceptanceRate Float?
  isPublished    Boolean  @default(false)
  isPremium      Boolean  @default(false)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  solutions  ProblemSolution[]
  testCases  TestCase[]
  editorial  Editorial?
  hints      ProblemHint[]
  variants   ProblemVariant[]

  @@index([difficulty, patterns])
  @@index([companies])
  @@index([slug])
}

model TestCase {
  id        String  @id @default(cuid())
  problemId String
  input     String  @db.Text
  output    String  @db.Text
  isPublic  Boolean @default(false)
  order     Int

  problem Problem @relation(fields: [problemId], references: [id])
  @@index([problemId])
}

model ProblemSolution {
  id          String   @id @default(cuid())
  problemId   String
  userId      String
  code        String   @db.Text
  language    String   // cpp | java | python | javascript
  verdict     String   // accepted | wrong_answer | tle | mle | re | ce
  runtimeMs   Int?
  memoryKb    Int?
  submittedAt DateTime @default(now())

  problem Problem @relation(fields: [problemId], references: [id])
  user    User    @relation(fields: [userId], references: [id])

  @@index([userId, submittedAt(sort: Desc)])
  @@index([problemId, verdict])
}

model DailySubmissionCount {
  id        String   @id @default(cuid())
  userId    String
  date      DateTime @db.Date
  count     Int      @default(0)
  planLimit Int      // 5 free, 20 basic, -1 unlimited

  user User @relation(fields: [userId], references: [id])
  @@unique([userId, date])
  @@index([userId, date])
}

model Editorial {
  id               String @id @default(cuid())
  problemId        String @unique
  textSolution     String @db.Text
  videoUrl         String?
  approachType     String
  patternExplained String @db.Text
  timeComplex      String
  spaceComplex     String

  problem Problem @relation(fields: [problemId], references: [id])
}

model ProblemHint {
  id        String @id @default(cuid())
  problemId String
  level     Int    // 1 | 2 | 3
  content   String @db.Text
  xpCost    Int    @default(10)

  problem Problem @relation(fields: [problemId], references: [id])
  @@index([problemId])
}

model ProblemVariant {
  id               String @id @default(cuid())
  problemId        String
  title            String
  description      String @db.Text
  twistExplanation String @db.Text
  samePattern      Boolean @default(true)

  problem Problem @relation(fields: [problemId], references: [id])
  @@index([problemId])
}

// ─── ROADMAP ─────────────────────────────────────────────────

model Roadmap {
  id          String @id @default(cuid())
  name        String
  targetRole  String
  totalDays   Int
  createdBy   String
  isPublished Boolean @default(false)

  items       RoadmapItem[]
  userRoadmaps UserRoadmap[]
}

model RoadmapItem {
  id        String @id @default(cuid())
  roadmapId String
  dayNumber Int
  type      String // problem | concept | mock | revision | cognitive
  refId     String
  order     Int
  notes     String?

  roadmap Roadmap @relation(fields: [roadmapId], references: [id])
  @@index([roadmapId, dayNumber])
}

model UserRoadmap {
  id            String   @id @default(cuid())
  userId        String
  roadmapId     String
  startDate     DateTime @default(now())
  currentDay    Int      @default(1)
  completionPct Float    @default(0)
  isActive      Boolean  @default(true)
  targetDate    DateTime?

  user    User    @relation(fields: [userId], references: [id])
  roadmap Roadmap @relation(fields: [roadmapId], references: [id])
  @@unique([userId, roadmapId])
}

model DailyStreak {
  id             String   @id @default(cuid())
  userId         String
  date           DateTime @db.Date
  problemsSolved Int      @default(0)
  minutesSpent   Int      @default(0)
  xpEarned       Int      @default(0)
  moodScore      Int?     // 1-5 from daily check-in

  user User @relation(fields: [userId], references: [id])
  @@unique([userId, date])
  @@index([userId, date(sort: Desc)])
}

// ─── CAREER TRACKS ───────────────────────────────────────────

model CareerTrack {
  id             String  @id @default(cuid())
  name           String  // backend | frontend | fullstack | genai | etc.
  displayName    String
  icon           String
  description    String
  salaryRangeMin Int
  salaryRangeMax Int
  demandLevel    String  // high | medium | low
  durationWeeks  Int
  dsaDifficulty  String  // light | medium | heavy
  isPublished    Boolean @default(false)

  weeklyModules  TrackWeeklyModule[]
  companyTargets TrackCompanyTarget[]
}

model TrackWeeklyModule {
  id          String @id @default(cuid())
  trackId     String
  weekNumber  Int
  title       String
  concept     String @db.Text
  problemIds  String[]
  projectTask String?
  companyNote String?

  track CareerTrack @relation(fields: [trackId], references: [id])
  @@index([trackId, weekNumber])
}

model TrackCompanyTarget {
  id          String @id @default(cuid())
  trackId     String
  company     String
  tier        String // faang | unicorn | midsize | service
  interviewStyle String

  track CareerTrack @relation(fields: [trackId], references: [id])
  @@index([trackId])
}

// ─── ASSESSMENT ──────────────────────────────────────────────

model AssessmentSession {
  id             String   @id @default(cuid())
  userId         String
  type           String   // initial | progress | quick
  totalQuestions Int
  correctAnswers Int
  timeTakenSecs  Int
  gapAnalysis    Json     // {topic: score}
  companyTargets Json     // {realistic: [], stretch: [], dream: []}
  placementProb  Json     // {company: probability}
  completedAt    DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
  @@index([userId, completedAt(sort: Desc)])
}

// ─── COGNITIVE GAMES ─────────────────────────────────────────

model CognitiveSession {
  id                String   @id @default(cuid())
  userId            String
  gameType          String
  companySimulation String?
  status            String   // created | in_progress | completed | flagged
  score             Float?
  accuracyPct       Float?
  speedScore        Float?
  sectionBreakdown  Json?
  tabSwitchCount    Int      @default(0)
  startedAt         DateTime @default(now())
  completedAt       DateTime?

  @@index([userId, completedAt(sort: Desc)])
}

// ─── MOCK INTERVIEWS ─────────────────────────────────────────

model MockSession {
  id            String   @id @default(cuid())
  type          String   // ai | peer | expert
  intervieweeId String
  interviewerId String?
  company       String?
  roundType     String   // technical | system_design | hr | behavioral
  status        String   // scheduled | in_progress | completed | cancelled
  recordingUrl  String?
  feedbackJson  Json?
  transcript    String?  @db.Text
  anxietyDelta  Float?
  scheduledAt   DateTime?
  completedAt   DateTime?
  createdAt     DateTime @default(now())

  interviewee User @relation("Interviewee", fields: [intervieweeId], references: [id])
}

// ─── MENTORSHIP ──────────────────────────────────────────────

model Mentor {
  id            String   @id @default(cuid())
  userId        String   @unique
  company       String
  currentRole   String
  yearsExp      Int
  expertise     String[]
  bio           String   @db.Text
  hourlyRate    Int      // paise (₹499 = 49900)
  rating        Float    @default(0)
  totalSessions Int      @default(0)
  responseRate  Float    @default(100)
  isVerified    Boolean  @default(false)
  verifiedAt    DateTime?
  isActive      Boolean  @default(true)

  user     User      @relation(fields: [userId], references: [id])
  bookings Booking[]

  @@index([company, isVerified])
  @@index([rating(sort: Desc)])
}

model Booking {
  id            String   @id @default(cuid())
  mentorId      String
  studentId     String
  sessionType   String
  durationMins  Int
  status        String   // pending | confirmed | completed | cancelled | refunded
  scheduledAt   DateTime
  paymentId     String?
  amountPaise   Int
  platformFee   Int
  mentorPayout  Int
  feedbackGiven Boolean  @default(false)
  createdAt     DateTime @default(now())

  mentor  Mentor @relation(fields: [mentorId], references: [id])
  student User   @relation("StudentBookings", fields: [studentId], references: [id])

  @@index([mentorId, scheduledAt])
  @@index([studentId, status])
}

// ─── CERTIFICATIONS ──────────────────────────────────────────

model Certificate {
  id               String   @id @default(cuid())
  userId           String
  type             String
  trackCompleted   String?
  score            Int?
  percentile       Float?
  verificationCode String   @unique @default(cuid())
  issuedAt         DateTime @default(now())
  linkedinAdded    Boolean  @default(false)
  paymentId        String?
  amountPaise      Int?

  user User @relation(fields: [userId], references: [id])
  @@index([userId])
  @@index([verificationCode])
}

// ─── PROJECTS ────────────────────────────────────────────────

model UserProject {
  id                      String   @id @default(cuid())
  userId                  String
  title                   String
  description             String   @db.Text
  githubUrl               String?
  techStack               String[]
  targetCompany           String?
  depthScore              Int?
  interviewProofCompleted Boolean  @default(false)
  createdAt               DateTime @default(now())

  questions ProjectQuestion[]
  user      User @relation(fields: [userId], references: [id])
  @@index([userId])
}

model ProjectQuestion {
  id          String @id @default(cuid())
  projectId   String
  question    String @db.Text
  category    String // architecture | scaling | technical | failure | improvement
  difficulty  String
  idealAnswer String @db.Text

  project UserProject @relation(fields: [projectId], references: [id])
}

// ─── GAMIFICATION ────────────────────────────────────────────

model XPLog {
  id        String   @id @default(cuid())
  userId    String
  amount    Int
  reason    String
  refId     String?
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
  @@index([userId, createdAt(sort: Desc)])
}

// ─── NOTIFICATIONS ───────────────────────────────────────────

model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String
  title     String
  body      String
  data      Json?
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
  @@index([userId, isRead, createdAt(sort: Desc)])
}
```

### Key Index Strategy

```sql
CREATE INDEX idx_problems_published_diff ON problems(is_published, difficulty);
CREATE INDEX idx_problems_patterns ON problems USING GIN(patterns);
CREATE INDEX idx_problems_companies ON problems USING GIN(companies);
CREATE INDEX idx_solutions_user_date ON problem_solutions(user_id, submitted_at DESC);
CREATE UNIQUE INDEX idx_sub_count_user_date ON daily_submission_counts(user_id, date);
CREATE UNIQUE INDEX idx_streak_user_date ON daily_streaks(user_id, date);
CREATE INDEX idx_mentors_company ON mentors(company, is_verified, is_active);
CREATE UNIQUE INDEX idx_cert_code ON certificates(verification_code);
CREATE INDEX idx_notif_user ON notifications(user_id, is_read, created_at DESC);
```

---

## Doc 12: API Contract

### Base Configuration

```
Base URL:     https://api.eyf.in/v1
Auth:         Bearer {JWT} in Authorization header
Content-Type: application/json
Rate limits:  Free: 60/min | Basic: 180/min | Pro: 600/min | Elite: 1200/min
```

### Standard Response Format

```json
// Success
{ "success": true, "data": {}, "meta": { "page": 1, "total": 150, "cursor": "..." } }

// Error
{
  "success": false,
  "error": {
    "code": "SUBMISSION_LIMIT_EXCEEDED",
    "message": "You've reached your daily submission limit (5/5). Upgrade to Pro for unlimited.",
    "upgradeRequired": true,
    "plan": "pro"
  }
}
```

### Error Codes

```
AUTH_REQUIRED          401  AUTH_INVALID           401
FORBIDDEN              403  PLAN_REQUIRED          403 (includes plan name)
NOT_FOUND              404  SUBMISSION_LIMIT       429
RATE_LIMITED           429  VALIDATION_ERROR       422 (includes field)
INTERNAL_ERROR         500  JUDGE_TIMEOUT          504
```

### All Endpoints

```
// Auth / Users
GET  /users/me                  PUT  /users/me
GET  /users/me/stats            GET  /users/me/streak
POST /users/me/mood

// Problems
GET  /problems                  GET  /problems/:slug
POST /problems/:id/submit       GET  /problems/:id/submissions
GET  /problems/:id/hints/:level GET  /problems/:id/variants
GET  /problems/:id/editorial    POST /problems/:id/visualize

// Submissions
GET  /submissions/daily-count   GET  /submissions/:id

// Assessment
POST /assessments/start         POST /assessments/:id/answer
GET  /assessments/:id/result    GET  /assessments/history
GET  /assessments/probability

// Career Tracks
GET  /tracks                    GET  /tracks/:id
POST /tracks/:id/select         GET  /tracks/my/curriculum

// Roadmap
GET  /roadmap/my                GET  /roadmap/today
POST /roadmap/complete/:itemId  POST /roadmap/sprint/start

// Mock Interviews
GET  /mocks                     POST /mocks/ai/start
POST /mocks/ai/:id/message      POST /mocks/ai/:id/end
GET  /mocks/:id/feedback        GET  /mocks/peer/queue
POST /mocks/expert/book

// Cognitive Games
GET  /cognitive/types           POST /cognitive/sessions/start
POST /cognitive/sessions/:id/answer
GET  /cognitive/sessions/:id/result
GET  /cognitive/analytics

// Resume
GET  /resume/my                 PUT  /resume/my
POST /resume/ats-score          POST /resume/export-pdf

// Jobs & Internships
GET  /jobs                      GET  /internships
GET  /drives                    POST /applications
PUT  /applications/:id          GET  /applications/my

// Mentors
GET  /mentors                   GET  /mentors/:id
GET  /mentors/:id/availability  POST /bookings
POST /bookings/:id/confirm-payment
GET  /bookings/my               POST /bookings/:id/feedback

// Certifications
GET  /certificates/my           POST /certificates/purchase
GET  /certificates/verify/:code POST /certificates/:id/linkedin

// Billing
POST /billing/subscribe         POST /billing/webhook
GET  /billing/my                POST /billing/cancel
GET  /billing/plans

// Notifications
GET  /notifications             PUT  /notifications/:id/read
PUT  /notifications/read-all    GET  /notifications/preferences
PUT  /notifications/preferences
```

### Plan Gating Middleware (TypeScript)

```typescript
export const requirePlan = (minPlan: 'basic' | 'pro' | 'elite') => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const planHierarchy = ['free', 'basic', 'pro', 'elite'];
    const userPlanIndex = planHierarchy.indexOf(request.user.subscription?.planId ?? 'free');
    const requiredIndex = planHierarchy.indexOf(minPlan);
    if (userPlanIndex < requiredIndex) {
      return reply.code(403).send({
        success: false,
        error: {
          code: 'PLAN_REQUIRED',
          message: `This feature requires ${minPlan} plan or higher.`,
          upgradeRequired: true,
          requiredPlan: minPlan,
          upgradePath: `/pricing?to=${minPlan}`
        }
      });
    }
  };
};

export const checkSubmissionLimit = async (request: FastifyRequest, reply: FastifyReply) => {
  const limits: Record<string, number> = { free: 5, basic: 20, pro: -1, elite: -1 };
  const plan = request.user.subscription?.planId ?? 'free';
  const limit = limits[plan];
  if (limit === -1) return; // unlimited

  const today = new Date().toISOString().split('T')[0];
  const count = await getSubmissionCount(request.user.id, today);

  if (count >= limit) {
    return reply.code(429).send({
      success: false,
      error: {
        code: 'SUBMISSION_LIMIT_EXCEEDED',
        message: `You've reached your daily limit (${limit}/${limit}). Upgrade to Pro for unlimited.`,
        upgradeRequired: true,
        requiredPlan: 'pro'
      }
    });
  }
};
```

---

## Doc 13: RBAC — Roles & Permissions

### Role Definitions

```
guest            Unauthenticated visitor
student_free     Registered, free plan (default on signup)
student_basic    Basic plan (₹249/mo)
student_pro      Pro plan (₹499/mo)
student_elite    Elite plan (₹899/mo)
mentor           Verified placed professional
content_creator  Verified educator (creates problems, editorials)
moderator        Community moderator
admin            EYF internal team
super_admin      Founders — full access
```

### Permission Matrix

| Permission | free | basic | pro | elite | mentor | content | mod | admin |
|---|---|---|---|---|---|---|---|---|
| **PROBLEMS** |
| View problem list | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Access 100 problems | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Access 500 problems | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Access all 2000+ | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Submit (5/day) | ✓ | — | — | — | — | — | — | — |
| Submit (20/day) | — | ✓ | — | — | — | — | — | — |
| Submit (unlimited) | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| View editorial | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| AI hints (3/day) | ✓ | — | — | — | — | — | — | — |
| AI hints (unlimited) | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| View variants | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **CORE SUBJECTS** |
| OS theory only | ✓ | — | — | — | — | — | — | — |
| All theory notes | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| SQL editor | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| LLD problems | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **MOCK INTERVIEWS** |
| AI mock (1/month) | ✓ | — | — | — | — | — | — | — |
| AI mock (3/month) | — | ✓ | — | — | — | — | — | — |
| AI mock (unlimited) | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Full feedback report | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Peer mock | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Expert mock (add-on) | — | — | ✓ | — | — | — | — | — |
| Expert mock (2 free/mo) | — | — | — | ✓ | — | — | — | — |
| **COGNITIVE GAMES** |
| Access cognitive games | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **CAREER TRACKS** |
| Preview all tracks | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 3 tracks (service) | — | ✓ | — | — | — | — | — | — |
| All 12 tracks | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **RESUME & JOBS** |
| Resume builder | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| ATS scorer | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Job board view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Application tracker | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Off-campus alerts | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **PROJECTS** |
| Project ideas (2) | — | ✓ | — | — | — | — | — | — |
| Project ideas (unlimited) | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Interview-proof (2) | — | — | ✓ | — | — | — | — | — |
| Interview-proof (unlimited) | — | — | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| **MENTORSHIP** |
| Browse mentors | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Book mentor (pay) | — | — | ✓ | ✓ | — | — | — | — |
| Book mentor (2 free/mo) | — | — | — | ✓ | — | — | — | — |
| Be a mentor | — | — | — | — | ✓ | — | — | — |
| **CERTIFICATIONS** |
| Purchase certs | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **ADMIN** |
| Create/edit problems | — | — | — | — | — | ✓ | — | ✓ |
| Approve problem | — | — | — | — | — | — | — | ✓ |
| Moderate community | — | — | — | — | — | — | ✓ | ✓ |
| View all users | — | — | — | — | — | — | — | ✓ |
| Manage subscriptions | — | — | — | — | — | — | — | ✓ |

# PART D — OPERATIONS

---

## Doc 14: Content Management Plan

### 14.1 Content Types

| Type | Who Creates | Review Process | Update Frequency |
|---|---|---|---|
| DSA Problems | Content creators + Admin | 2-reviewer + automated test validation | Continuous |
| Problem Editorials | Content creators | 1 senior reviewer | Per problem |
| Problem Hints | Content creators | 1 reviewer | Per problem |
| Core Subject Notes | Admin + Expert contributors | Admin approval | Quarterly |
| Company Tracks | Admin + Community data | Admin curated | Monthly |
| Interview Experiences | Community (students) | AI pre-screen + human mod | Real-time |
| Blog / Placement Stories | EYF team + placed students | Editorial review | Weekly |
| Career Track Curriculum | Admin only | Admin only | Quarterly |
| OA Fingerprint Data | Community (debrief form) | Automated aggregation | Real-time |
| Salary Database | Placed users (on marking placed) | Anonymised auto-aggregate | Real-time |

---

### 14.2 Problem Creation Workflow

```
STEP 1 — DRAFT
  Creator opens /admin/problems/new
  Fills: title, description, constraints, examples, difficulty,
         topics[], patterns[], companies[]
  Adds: minimum 3 public test cases + 10 hidden test cases
  Writes: reference solution in at least 1 language
  Saves as DRAFT

STEP 2 — TEST VALIDATION (automated, immediate on save)
  System runs reference solution against all test cases
  Any test case fails → creator notified, stays DRAFT
  All pass → moves to REVIEW

STEP 3 — PEER REVIEW
  Reviewer 1: problem clarity, constraints, examples, difficulty calibration
  Reviewer 2: test case coverage, edge cases, company tag accuracy
  Both must approve → moves to EDITORIAL

STEP 4 — EDITORIAL
  Creator (or assigned editor) writes:
    - Approach explanation (markdown)
    - Pattern identification
    - Time + space complexity
    - Clean commented code solution
    - Optional: video link
  1 peer review before publishing

STEP 5 — PUBLISH
  Admin sets isPublished: true
  Problem appears in list within 5 minutes (cache invalidation)

STEP 6 — QUALITY MONITORING (ongoing)
  Acceptance rate tracked — flagged if < 10% or > 90% after 50 submissions
  Community flags reviewed weekly
  Report button on every problem:
    "Problem unclear" | "Wrong test case" | "Wrong difficulty"
```

---

### 14.3 Interview Experience Moderation

```
USER SUBMITS experience

STEP 1 — AUTOMATED PRE-SCREEN (< 30 seconds)
  ✓ Minimum word count: 100 words
  ✓ Company name from valid company list
  ✓ No PII (phone, email) — regex check
  ✓ No offensive language — content moderation API
  ✓ Not a duplicate — similarity check against existing
  Fails any → returned to user with specific reason
  Passes → PENDING_REVIEW

STEP 2 — AI QUALITY CHECK (< 2 minutes)
  Claude API: "Is this a genuine interview experience?
  Does it contain specific technical questions?
  Is it helpful to students? Score 1–10."
  Score < 6 → human moderation queue with flag
  Score ≥ 6 → auto-approved

STEP 3 — HUMAN MODERATION (flagged only, 24-hour SLA)
  Options: Approve | Reject (with reason) | Request edit
  Rejected user notified with reason + ability to resubmit

STEP 4 — LIVE
  Published, searchable, tagged to company
  XP awarded to submitter: 50 XP
```

---

### 14.4 Content Update & Deletion Policy

```
DSA Problems:     Never deleted — only unpublished. Changes version-controlled.
Editorials:       Updated when better approaches found. Previous version accessible.
Company tracks:   Curated monthly. OA fingerprint auto-updates from community.
Theory notes:     Reviewed and updated quarterly by subject matter experts.
Blog posts:       Author-owned. Updated by author or admin.
Salary data:      Auto-aggregated. Historical data preserved (never deleted).
User content:     Deleted on user account deletion request (DPDP compliance).
```

---

### 14.5 Content Admin Panel Features

```
/admin routes (admin role only):

/admin/problems           — List, filter, bulk publish/unpublish
/admin/problems/new       — Create problem
/admin/problems/:id       — Edit problem, view test results, see flag reports
/admin/editorials         — List editorials pending review
/admin/experiences        — Moderation queue, approve/reject
/admin/tracks             — Career track curriculum management
/admin/users              — User management, plan override, ban
/admin/analytics          — Revenue, DAU, conversion, placement stats
/admin/payouts            — Pending mentor payouts, manual override
/admin/flags              — All content flags sorted by priority
```

---

## Doc 15: Monetisation & Billing Document

### 15.1 Plan Summary

```
FREE   ₹0        Acquisition. Creates desire. Not enough to succeed alone.
BASIC  ₹249/mo   Foundation. Theory + limited submissions.
PRO    ₹499/mo   Primary revenue. Full platform. Target 70% of paid users.
ELITE  ₹899/mo   Premium. Human mentorship included. Target FAANG + switchers.

Annual (always shown first, monthly is the "expensive" option):
BASIC  ₹1,999/yr  ₹166/mo  Save ₹1,000
PRO    ₹3,999/yr  ₹333/mo  Save ₹2,000
ELITE  ₹6,999/yr  ₹583/mo  Save ₹3,800
```

---

### 15.2 Razorpay Integration

**Subscriptions:**
```
Create:   POST razorpay /v1/subscriptions
Webhook events to handle:
  subscription.activated  → set planId + status = active in DB
  subscription.charged    → log payment record
  subscription.halted     → send dunning email, 7-day grace period
  subscription.cancelled  → downgrade to free at period end
  subscription.completed  → prompt renewal

Webhook security:
  Verify Razorpay-Signature header (HMAC-SHA256)
  Idempotency: check payment ID not already processed before fulfilling
```

**One-time payments (certs, add-on mocks, bootcamps):**
```
Create order → POST /v1/orders
Capture event: payment.captured → fulfill order
```

**Mentor payouts (Razorpay Connect):**
```
Create linked account per verified mentor on verification
Transfer 80% of session fee after student feedback submitted
Automated payout every Monday for prior week's sessions
First payout: manual review before release
```

---

### 15.3 Plan Transition Rules

```
FREE → ANY PAID:      Immediate activation on payment
PRO → ELITE:          Immediate access. Prorated charge for remaining days.
ELITE → PRO:          Takes effect at next billing cycle. Retain Elite till period ends.
ANY → FREE (cancel):  Access maintained until period end. Data retained 90 days.
Resubscription:       Restores all data.

DUNNING (failed payment):
  Day 0:  Payment fails → email
  Day 3:  Retry + email reminder
  Day 7:  Final retry + "account will pause" warning
  Day 8:  Account paused (submissions blocked, Pro features locked)
  Day 30: Downgrade to Free
```

---

### 15.4 Add-On Products

| Product | Price | Notes |
|---|---|---|
| Expert Mock Interview | ₹499/session | Pro buys add-on. Elite gets 2 free/mo. |
| Track Completion Cert | ₹299 | Available on 80%+ readiness + track done |
| Skill Assessment Cert | ₹199 | After assessment score ≥ 75% |
| Interview Performance Cert | ₹499 | After expert-reviewed mock |
| Mock Placement Drive | ₹199/event | Pro+ free. Others pay. |
| Resume Professional Review | ₹499 | 48hr turnaround, human reviewer |
| Cohort Bootcamp Seat | ₹3,999–₹9,999 | Plan-independent. Run during placement season. |

---

### 15.5 Upgrade Prompt Design Rules

Every paywall must include:
1. The specific feature blocked (not just "Upgrade to Pro")
2. Outcome language ("see your full mock feedback → know exactly what to improve")
3. Social proof ("847 students upgraded this month after their first mock")
4. The exact plan needed and its price
5. Annual option shown first

```typescript
// Upgrade prompt payload from API
{
  code: 'PLAN_REQUIRED',
  feature: 'AI mock feedback report',
  message: 'See your full feedback breakdown — Technical: 71, Communication: 52, Approach: 74',
  socialProof: '847 students upgraded after their first mock this month',
  requiredPlan: 'pro',
  monthlyPrice: 499,
  annualPrice: 3999,
  annualSaving: 2000,
  upgradePath: '/pricing?to=pro&from=basic&feature=mock_feedback'
}
```

---

## Doc 16: Data & Analytics Plan

### 16.1 Event Schema

All events: `noun_verb` pattern. Every event includes:
```json
{
  "event": "problem_solved",
  "userId": "user_123",
  "sessionId": "session_abc",
  "timestamp": "2025-06-15T14:23:00Z",
  "plan": "pro",
  "platform": "web",
  "properties": {}
}
```

---

### 16.2 Core Events

```
ACQUISITION:
  page_viewed             page, referrer, utm_source, utm_medium
  cta_clicked             cta_text, page, position
  signup_started          method (google | phone)
  signup_completed        method, time_to_complete_seconds

ONBOARDING:
  onboarding_step_completed   step, time_spent_seconds
  assessment_started
  assessment_completed        score, time_taken, gaps_count
  roadmap_generated           track, timeline_days

PROBLEMS:
  problem_viewed          problem_id, difficulty, source (roadmap|search|random)
  code_submitted          problem_id, language, verdict, runtime_ms
  submission_limit_hit    plan (triggers upgrade prompt analytics)
  hint_unlocked           problem_id, hint_level, xp_spent
  variant_viewed          problem_id, variant_id
  visualizer_opened       problem_id, visualizer_type (2d|3d)

MOCKS:
  mock_started            type (ai|peer|expert), company, round_type
  mock_completed          type, duration_mins, anxiety_delta
  mock_feedback_viewed    session_id, lowest_dimension_score
  expert_mock_booked      mentor_company, amount_paise

COGNITIVE:
  cognitive_session_started     game_type, company_simulation
  cognitive_session_completed   score, accuracy, tab_switch_count
  anxiety_index_updated         old_value, new_value, delta

CONVERSION:
  upgrade_prompt_shown    feature, from_plan, to_plan, trigger
  upgrade_prompt_dismissed
  plan_selected           plan, billing_period
  payment_started         plan, amount, method
  payment_completed       plan, amount, method, time_from_prompt_seconds
  payment_failed          failure_reason

RETENTION:
  daily_checkin           streak_day, mood_score
  streak_milestone        days (7|14|30|50|100)
  streak_broken           streak_length
  pod_checkin             pod_id
  notification_opened     type, hours_since_sent

PLACEMENT (most important event):
  placement_marked        company, role, ctc_lpa, college_tier,
                          days_on_platform, problems_solved, mocks_done,
                          track_completed, assessment_score_at_start,
                          assessment_score_at_placement
```

---

### 16.3 PostHog Configuration

```
Identify on auth: posthog.identify(userId, { plan, track, graduationYear, collegeTier })
Super properties: plan, track, graduation_year, college_tier (set on every event)

Feature flags to create at launch:
  new-onboarding-v2       A/B test onboarding flow
  ai-career-strategist    Gradual rollout to Elite users
  sunday-oa-contest       Enable/disable weekly contest
  voice-practice-mode     Gradual rollout to Pro
  3d-visualizer           Desktop only, phased rollout
```

---

### 16.4 Key Business Metrics Dashboard

| Metric | Target | Alert Threshold |
|---|---|---|
| DAU | Growing 10% MoM | < -5% WoW |
| Daily Streak Rate | 60%+ of active users | < 50% |
| Problems Solved / DAU | 3+ average | < 2 |
| Assessment Completion (Day 1) | 70%+ of signups | < 60% |
| Free → Paid Conversion | 5–8% | < 4% |
| Monthly Churn | < 5% | > 7% |
| Placement Rate | Increasing MoM | — |
| Anxiety Index Avg | Decreasing trend | Increasing 2 months straight |

---

### 16.5 Placement DNA Pipeline

```
COLLECTION (from Day 1):
  Every user action logged to events table (ClickHouse for analytics)
  On placement_marked: retroactively tag entire user's event history

PROCESSING (weekly batch job, Sunday midnight):
  For each placed user, extract:
    problems_solved_by_pattern: {pattern: count}
    mock_sessions_count: int
    cognitive_sessions_count: int
    days_active: int
    avg_problems_per_day: float
    assessment_score: float
    company_targeted: string

MODELLING (after 1,000 placements):
  XGBoost: prep_signals → placement_probability_per_company
  Retrain monthly
  Output: per-company probability score for each active user

PRIVACY:
  Placement data anonymised before modelling
  Aggregated statistics only shown publicly
  Individual salary never shared without explicit consent
```

---

## Doc 17: Notification & Communication Plan

### 17.1 Channels & Consent

| Channel | Tool | Use Case | Consent |
|---|---|---|---|
| Push (web/mobile) | FCM | Streak, mocks, drives | Opt-in on signup |
| Email (transactional) | Resend | OTP, receipts, assessment results | No consent needed |
| Email (marketing) | Customer.io | Lifecycle, weekly digest | Opt-in checkbox in onboarding |
| SMS | MSG91 | OTP only | Implicit (required for auth) |
| WhatsApp | Meta Business API | Daily problem, streak, drives | Explicit opt-in |
| In-app | Custom system | All notifications | Always on |

---

### 17.2 Critical Notification Flows

**Streak Protection:**
```
Trigger:  User has no activity logged by 8 PM IST
Channel:  Push
Title:    "Don't break your {n}-day streak 🔥"
Body:     "Solve one problem in the next 4 hours to keep it alive."
Action:   Deep link → today's roadmap problem
Limit:    Max 1 per day. Not sent if user already active today.
```

**Daily Challenge:**
```
Trigger:  9:00 AM IST daily
Channels: Push + WhatsApp (if opted in)
Title:    "Today's challenge: {problem title}"
Body:     "{acceptance rate}% of {company} applicants solved this. Can you?"
Action:   Deep link → specific problem
Content:  Problem from user's current roadmap + pattern gap
```

**Campus Drive Alert:**
```
Trigger:  New drive matching user's eligibility profile
Channels: Push + WhatsApp + email (all three — high urgency)
Title:    "{Company} off-campus drive — {days} days to apply"
Body:     "CGPA ≥ {cutoff} · {Year} batch · {Role} · Deadline: {date}"
Action:   Drive detail + prep track link
Limit:    Max 3 drive alerts per day per user
```

**Mock Interview Reminder:**
```
1 hour before:  Push + email
  Title: "Your mock interview starts in 1 hour"
  Body:  "{type} with {Mentor / AI} · {time}"

15 minutes before: Push only
  Title: "15 minutes! Get ready."
  Body:  "Open EYF and check your microphone."
```

**Submission Limit Hit:**
```
Trigger:  Free or Basic user hits daily limit
Channel:  In-app only (they're already on the platform)
Show:     Upgrade prompt with specific feature benefit
          + exact savings on annual plan
          + social proof ("847 students upgraded this month")
```

**Placement Celebration:**
```
Trigger:  User marks placement as accepted
In-app:   Full-screen confetti + "Congratulations! You got placed at {Company}!"
          + "Share your journey to inspire others →" (placement story prompt)
Email:    "You did it, {Name}." — full journey summary
          Problems solved + days on platform + mocks done + readiness at placement
          CTA: Share on LinkedIn | Become a mentor | Write your story
```

---

### 17.3 Email Templates

**Weekly Progress (every Monday 9 AM):**
```
Subject: "Week {n} on EYF — here's where you stand"
Content:
  Problems solved this week vs last (trend arrow)
  Current streak
  Readiness score change
  This week's recommended focus (from gap analysis)
  One placement story from similar profile student
CTA: "Continue your roadmap →"
```

**Assessment Completion:**
```
Subject: "Your EYF skill report is ready"
Content: top 3 gaps + company calibration preview + first 3 roadmap days
CTA: "View full report →"
```

**Inactivity Re-engagement (Day 3, Day 7, Day 14):**
```
Day 3:  "You started something — don't stop here"
        Show: gap report preview + what happens if they continue vs stop
Day 7:  "Your roadmap is waiting" + peer progress comparison (anonymous)
Day 14: "One last thing" + free month if they complete assessment (if not done)
```

**Pre-Drive Alert (7 days, 3 days, 1 day before known company drive):**
```
Subject: "{Company} drive in {n} days — are you ready?"
Content: readiness score + top 3 remaining gaps + quick 3-problem sprint pack
CTA: "Start sprint →"
```

---

### 17.4 WhatsApp Bot Commands

```
User sends to EYF WhatsApp:

"problem"     → Today's daily challenge (link + difficulty + company)
"hint"        → Hint for the daily challenge
"streak"      → Current streak + this week's activity
"roadmap"     → Today's roadmap tasks
"drives"      → All drives matching user profile in next 7 days
"stop"        → Unsubscribe from WhatsApp notifications
"help"        → List available commands

Automated:
  9 AM daily:    Daily challenge
  8 PM:          Streak reminder (only if inactive)
  On drive post: Eligibility-matched drive alert
```

---

## Doc 18: Security & Compliance Document

### 18.1 Threat Model

| Threat | Risk | Mitigation |
|---|---|---|
| User code execution (RCE) | Critical | Judge0 + Docker + gVisor. No network. No filesystem writes. |
| SQL injection | High | Prisma ORM only. Parameterised queries. No raw SQL strings. |
| Auth bypass | High | Clerk managed auth (SOC 2). |
| Brute force login | High | Clerk rate limiting + account lockout after 5 attempts. |
| IDOR (access other user data) | High | Row-level checks on every query. Prisma where userId = request.user.id. |
| Data breach (PII) | High | Minimal PII. Neon AES-256. |
| Payment fraud | High | Razorpay handles all payment data. EYF stores zero card data. |
| XSS in user content | Medium | DOMPurify on all user-generated content before render. |
| Mentor payout fraud | Medium | Identity verification before payout. Manual review on first payout. |
| Prompt injection (Claude API) | Medium | System prompts hardened. User input sandboxed. Outputs validated. |

---

### 18.2 OWASP Top 10 Checklist

```
A01 Broken Access Control:    RBAC middleware on every route. Prisma where userId checks.
A02 Cryptographic Failures:   TLS 1.3. AES-256 at rest. No sensitive data in logs or URLs.
A03 Injection:                Prisma ORM only. Input validation with zod on all endpoints.
A04 Insecure Design:          Threat model complete. Security reviewed in PRs.
A05 Security Misconfiguration: IaC (Terraform). All secrets in env vars, never in code.
A06 Vulnerable Components:    Dependabot weekly. Snyk in CI pipeline.
A07 Auth Failures:            Clerk managed auth. httpOnly cookies. Token rotation.
A08 Software Integrity:       GitHub signed commits. Container image scanning.
A09 Security Logging:         All auth events logged. Anomaly alerts in Datadog.
A10 SSRF:                     Allowlist for external requests. No user-controlled URLs fetched.
```

---

### 18.3 India DPDP Act 2023 Compliance

```
CONSENT:
  Clear consent at signup for data collection
  Separate opt-in for marketing communications
  Consent records stored with timestamp + IP

USER RIGHTS:
  Right to access:     GET /users/me exports all personal data as JSON
  Right to correction: PUT /users/me
  Right to erasure:    DELETE /users/me — 30-day processing, data purged
  Grievance redressal: privacy@eyf.in, 30-day resolution SLA

DATA FIDUCIARY:
  Privacy policy at eyf.in/privacy (updated annually minimum)
  Sub-processors listed: Neon, Cloudflare, Clerk, Razorpay, Anthropic, MSG91
  Data retention: active users — indefinite. Deleted accounts — 30 days.

BREACH NOTIFICATION:
  Users notified within 72 hours of confirmed breach
  CERT-In notification as legally required
  Incident response playbook in ops runbook
```

---

### 18.4 Code Execution Security

```
ISOLATION LAYERS:
  1. Docker container per submission (fresh container every time)
  2. gVisor (runsc) runtime — kernel call filtering
  3. No network access: --network none
  4. Read-only filesystem (except /tmp, max 50MB)
  5. CPU time limit: 2 seconds per submission
  6. Memory limit: 256MB per submission
  7. Process limit: 64 processes
  8. No privileged capabilities

SEPARATION:
  Judge0 runs on dedicated Hetzner VPS
  No shared network with application servers
  API key required for all Judge0 API calls
  API key rotated monthly

MONITORING:
  Alert if Judge0 VPS CPU > 80% for > 5 minutes
  Rate limit: 5 submissions/minute per user regardless of plan (DoS protection)
  Queue depth alert: > 100 jobs waiting → auto-scale workers
```

---

### 18.5 Secrets Management

```
LOCAL:      .env.local (gitignored, never committed)
STAGING:    Railway env vars + Vercel env vars
PRODUCTION: Railway env vars + Vercel env vars (separate values from staging)

NEVER: secrets in code, secrets in git, secrets in URLs, secrets in logs

ROTATION SCHEDULE:
  ANTHROPIC_API_KEY:      Quarterly
  RAZORPAY_KEY_SECRET:    Annually (or on suspected compromise)
  JUDGE0_AUTH_TOKEN:      Monthly
  CLERK_SECRET_KEY:       Clerk-managed rotation
  DATABASE_URL:           Neon-managed

SCANNING:
  TruffleHog in CI — blocks merge if secrets detected
  GitHub secret scanning enabled on repository
```

---

## Doc 19: DevOps & Infrastructure Document

### 19.1 Environment Configuration

```
DEVELOPMENT:
  Frontend:  localhost:3000 (next dev)
  API:       localhost:3001 (fastify dev)
  DB:        localhost:5432 (docker-compose postgres)
  Redis:     localhost:6379 (docker-compose redis)
  Judge0:    localhost:2358 (docker-compose)
  Auth:      Clerk development instance

STAGING:
  Frontend:  staging.eyf.in (Vercel preview)
  API:       staging-api.eyf.in (Railway staging)
  DB:        Neon staging branch (branched from main)
  Redis:     Upstash staging database
  Deploy:    Automatic on merge to main

PRODUCTION:
  Frontend:  eyf.in, app.eyf.in (Vercel production)
  API:       api.eyf.in (Railway production)
  DB:        Neon production (main branch)
  Redis:     Upstash production
  Judge0:    Hetzner CX21 VPS (dedicated, isolated)
  Deploy:    Manual approval after staging sign-off
```

---

### 19.2 Monorepo Structure

```
eyf/
├── apps/
│   ├── web/                   # Next.js 14 App Router
│   │   ├── app/               # App Router pages + layouts
│   │   ├── components/        # Page-specific components
│   │   ├── lib/               # Utils, hooks, API client
│   │   └── public/
│   ├── api/                   # Fastify backend
│   │   ├── src/
│   │   │   ├── routes/        # Route handlers by domain
│   │   │   ├── middleware/    # Auth, plan-gating, rate-limit
│   │   │   ├── services/      # Business logic
│   │   │   └── jobs/          # Background jobs (BullMQ)
│   │   └── Dockerfile
│   └── judge/                 # Judge0 Docker config
├── packages/
│   ├── db/                    # Prisma schema + client
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── src/index.ts       # Prisma client export
│   ├── ui/                    # Shared component library
│   │   └── src/components/
│   ├── types/                 # Shared TypeScript types
│   └── config/                # ESLint, Tailwind, TS base configs
├── .github/
│   └── workflows/
│       ├── ci.yml             # PR checks
│       └── deploy.yml         # Staging + production deploy
├── docker-compose.yml         # Local development
├── turbo.json                 # Turborepo pipeline config
└── package.json               # Root (pnpm workspaces)
```

---

### 19.3 CI/CD Pipeline

```yaml
# CI — runs on every PR
name: CI
on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo type-check    # tsc --noEmit on all packages
      - run: pnpm turbo lint          # eslint
      - run: pnpm turbo test          # jest unit + integration
      - run: pnpm turbo build         # verify builds succeed
      - run: npx bundlesize            # block if bundle grows > threshold
      - run: npx snyk test            # security vulnerability scan

  staging-deploy:
    needs: quality
    if: github.ref == 'refs/heads/main'
    steps:
      - Deploy frontend to Vercel preview
      - Deploy API to Railway staging
      - Run: pnpm prisma migrate deploy (against Neon staging branch)
      - Run: pnpm playwright test (smoke tests)
      - Comment preview URL on PR

  production-deploy:
    needs: staging-deploy
    environment: production    # requires manual approval in GitHub
    steps:
      - Snapshot Neon DB before migration
      - Run: pnpm prisma migrate deploy (production)
      - Deploy API to Railway (rolling deploy — zero downtime)
      - Deploy frontend to Vercel production
      - Run: production smoke tests
      - Notify #deployments Slack channel
```

---

### 19.4 Database Migration Strategy

```
EXPAND-CONTRACT PATTERN for zero-downtime:

Adding a column:
  Step 1: Add column as nullable (expand)
  Step 2: Deploy code that writes to both old + new column
  Step 3: Backfill existing rows
  Step 4: Add NOT NULL constraint + default
  Step 5: Remove old code writing to old column (contract)

Renaming a column:
  Step 1: Add new column, keep old (expand)
  Step 2: Deploy code reading from new, writing to both
  Step 3: Backfill new column from old
  Step 4: Deploy code reading + writing only new (contract)
  Step 5: Drop old column (separate deploy, after verification)

NEVER in production deploy:
  - DROP TABLE
  - DROP COLUMN (without prior deprecation period)
  - NOT NULL on existing column without default
  - Rename column in single step
```

---

### 19.5 Monitoring & Alerting

**Uptime Monitoring (BetterUptime):**
```
Check every 60 seconds from India + Singapore:
  https://eyf.in                   (landing page)
  https://api.eyf.in/health        (API health check)
  https://api.eyf.in/v1/problems   (core API)
  https://judge0.eyf.in/about      (Judge0 health)

Alert channels: Slack + PagerDuty
Status page: status.eyf.in
```

**Application Monitoring (Datadog):**
```
APM: All API routes traced with OpenTelemetry
Logs: Structured JSON, 30-day retention
  Required fields on every log: userId, service, traceId, level

Dashboards:
  - API error rate by route
  - API P95 latency by route
  - DB connection pool utilisation
  - Judge0 queue depth + worker count
  - Daily submission counts by plan
  - Revenue metrics
```

**Alert Thresholds:**
```
P1 — Page immediately (PagerDuty):
  API error rate > 5% for 5 consecutive minutes
  Uptime check fails 3 times in a row
  Database connection failures
  Razorpay webhook failures

P2 — Slack alert (office hours):
  API P95 latency > 1s for 10 minutes
  Judge0 queue depth > 100 jobs
  DAU drops > 20% from previous day same time
  Churn rate increases > 2% in 7-day rolling window

P3 — Weekly review:
  Bundle size increase > 10% from last week
  New high-severity vulnerability in dependencies
  API error rate creeping up (< 5% but trending up)
```

---

### 19.6 Backup & Recovery

```
DATABASE (Neon):
  Automatic point-in-time recovery: 7-day retention
  Manual snapshot: before every schema migration (automated in deploy pipeline)
  RPO: 15 minutes | RTO: < 1 hour

FILES (Cloudflare R2):
  Interview recordings: 90-day retention, then auto-deleted
  Resume PDFs: retained while user is active
  Certificate assets: permanent retention
  Problem assets (images, diagrams): permanent

DISASTER RECOVERY RUNBOOK:
  1. Detect (monitoring alert or user report in #incidents)
  2. Declare incident, assign incident commander (on-call engineer)
  3. Assess: what is down, how many users affected, revenue impact
  4. Communicate on status.eyf.in every 30 minutes
  5. DB issue → restore from Neon point-in-time snapshot
  6. API issue → rollback Railway to previous deployment (1 click)
  7. Judge0 issue → disable submission endpoints, show maintenance message
  8. Frontend issue → Vercel instant rollback to previous deployment
  9. Post-incident review within 48 hours (blameless)
```

---

### 19.7 Scaling Playbook

```
WHEN TO SCALE WHAT:

API servers (Railway):
  Trigger: P95 latency > 500ms or CPU > 70% for 15 min
  Action: Increase Railway instance count (1 → 3 → 5)
  Cost: ~₹2,000 per additional instance/month

Judge0 workers (Hetzner):
  Trigger: Queue depth > 50 for > 5 minutes
  Action: Add worker nodes (horizontal scaling)
  Pre-scale: Every August 15 before placement season starts

Database (Neon):
  Trigger: DB connection pool > 80% utilisation
  Action: Upgrade Neon plan or add read replicas
  Cache: Add Redis caching layer for hot data before DB scaling

Redis (Upstash):
  Trigger: Upstash bandwidth limits approaching
  Action: Upgrade Upstash plan
  Cheap: rarely the bottleneck before 1M MAU
```

---

# APPENDIX: Claude Code System Prompt

```
Read this before writing any code for EYF.

=== WHO YOU ARE BUILDING ===
EYF (Engineer Your Future) — India's placement preparation SaaS.
India's first end-to-end placement operating system for engineering students.

=== DESIGN RULES (never violate) ===
1. Dark mode primary: background #0A0A0A, surface #111111
2. Single accent: #E8FF47 (electric yellow-green) — nothing else
3. No purple/indigo/cyan gradients — completely banned
4. No generic shadcn card grids for features
5. Typography: Geist (display), Inter (body), JetBrains Mono (code)
6. All animations: Framer Motion only, purposeful only
7. Landing page: apple.com quality. Dashboard: linear.app quality.
8. Never use glass morphism, floating orbs, or neon glow
9. Spinners are banned — use skeleton screens
10. Error messages are human: "Your code exceeded 256MB memory. Optimise space complexity."

=== TECHNICAL RULES (never violate) ===
1. TypeScript strict mode throughout all files
2. All DB queries through Prisma only — no raw SQL strings ever
3. Never execute user code outside Judge0 Docker containers
4. Every protected API route has plan-gating middleware (requirePlan)
5. Every code submission endpoint has checkSubmissionLimit middleware
6. PostHog event tracking on every meaningful user action
7. All user-generated content sanitised with DOMPurify before render
8. Zod validation on all API request bodies
9. Expand-contract migration pattern for all schema changes
10. httpOnly cookies for refresh tokens — never localStorage for auth

=== PLAN GATES ===
free:  5 submissions/day, 100 problems, OS theory only, 1 AI mock/month (no feedback)
basic: 20 submissions/day, 500 problems, all theory (no SQL/LLD), 3 mocks/month (summary only)
pro:   unlimited, all 2000+ problems, cognitive games, all mocks + full AI feedback,
       career tracks (all 12), resume builder, voice practice, pressure training
elite: everything in pro + 2 expert mocks/month included + AI career strategist +
       PPO conversion system + Code DNA + unlimited interview-proof projects

=== FOLDER STRUCTURE ===
apps/web       — Next.js 14 App Router (eyf.in)
apps/api       — Fastify backend (api.eyf.in)
apps/judge     — Judge0 Docker config
packages/db    — Prisma schema + client export
packages/ui    — Shared component library
packages/types — Shared TypeScript types

=== KEY INTEGRATIONS ===
Auth:        Clerk (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY)
DB:          PostgreSQL via Neon (DATABASE_URL, DIRECT_URL)
Cache:       Redis via Upstash (UPSTASH_REDIS_URL, UPSTASH_REDIS_TOKEN)
Payments:    Razorpay (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET)
AI:          Claude API (ANTHROPIC_API_KEY) — Sonnet for complex, Haiku for simple
Judge:       Judge0 self-hosted (JUDGE0_API_URL, JUDGE0_AUTH_TOKEN)
Storage:     Cloudflare R2 (CF_R2_ACCESS_KEY, CF_R2_SECRET_KEY, CF_R2_BUCKET)
Email:       Resend (RESEND_API_KEY)
Analytics:   PostHog (NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST)

=== BEFORE EVERY UI COMPONENT ===
Ask: Does this look hand-crafted or AI-generated?
Ask: Is the spacing intentional or auto-padded?
Ask: Is the typography doing the work, or are decorations compensating?
Ask: Would this look at home on apple.com (landing) or linear.app (dashboard)?
If any answer is wrong, redesign before writing.

=== BEFORE EVERY API ENDPOINT ===
Check: Is requirePlan middleware applied if the feature is gated?
Check: Is checkSubmissionLimit applied on submission endpoints?
Check: Is the request body validated with zod?
Check: Is the response shape following the standard {success, data, meta} format?
Check: Is the error format following {success: false, error: {code, message}}?

=== COLOUR REFERENCE ===
Background:    #0A0A0A  Surface: #111111  Border: #1C1C1C
Electric:      #E8FF47  Dim:     #B8CC38  Bg:     #1A1F00
Text primary:  #FAFAF9  Secondary: #A1A1AA  Tertiary: #52525B
Danger:        #FF4500  Success: #00FF87  Warning: #FFB020
Easy:          #00FF87  Medium:  #FFB020  Hard:    #FF4500

=== SEEDING REQUIRED BEFORE MVP DEMO ===
200 problems with: title, slug, difficulty, topics[], patterns[],
                   companies[], description, constraints, examples, test cases
15 patterns tagged
30 companies tagged
5 complete editorials
3 career tracks configured (Backend, Frontend, Full Stack minimum)
2 assessment question sets (one per difficulty level)
```

---

*EYF Master Pre-Build Documentation Suite — Part 3 of 3*
*Version 1.0 · Operations + Appendix*
# EYF — Gap Resolution Document
# All 10 Critical Gaps Solved — Build-Ready Specifications
# Version 1.0 | Add to EYF_Master_Docs.md before Claude Code starts

---

## Doc 20: India Connectivity & Offline Architecture

### The Reality
Primary EYF user is on 4G in Bhopal, Nagpur, Patna with constant network drops.
Every competitor loses student data on disconnect. EYF never will.

### PWA Configuration

```typescript
// apps/web/next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.eyf\.in\/v1\/problems/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'problems-cache',
        expiration: { maxEntries: 200, maxAgeSeconds: 86400 }
      }
    },
    {
      urlPattern: /^https:\/\/api\.eyf\.in\/v1\/roadmap/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'roadmap-cache',
        expiration: { maxEntries: 10, maxAgeSeconds: 3600 }
      }
    }
  ]
})
```

### Code Autosave System

```typescript
// Never lose code on disconnect — saves to localStorage every 30 seconds
// and on every keypress after 2-second debounce

const useCodeAutosave = (problemId: string, code: string) => {
  const key = `eyf_draft_${problemId}`

  // Save on change (debounced 2s)
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(key, JSON.stringify({
        code, savedAt: Date.now(), problemId
      }))
    }, 2000)
    return () => clearTimeout(timer)
  }, [code])

  // Restore on load
  const getSavedCode = () => {
    try {
      const saved = localStorage.getItem(key)
      if (!saved) return null
      const { code, savedAt } = JSON.parse(saved)
      // Only restore if saved in last 24 hours
      if (Date.now() - savedAt < 86400000) return code
    } catch { return null }
  }

  // Clear after successful submission
  const clearSaved = () => localStorage.removeItem(key)

  return { getSavedCode, clearSaved }
}
```

### Offline Problem Queue

```typescript
// Student can queue up to 10 problems for offline solving
// Submissions queue up and sync when connection returns

model OfflineQueue {
  id          String   @id @default(cuid())
  userId      String
  problemId   String
  code        String   @db.Text
  language    String
  queuedAt    DateTime @default(now())
  synced      Boolean  @default(false)
  syncedAt    DateTime?
}

// Background sync: whenever connection returns
// Service worker fires 'sync' event → processes queue
self.addEventListener('sync', (event) => {
  if (event.tag === 'submission-queue') {
    event.waitUntil(processSubmissionQueue())
  }
})
```

### Low-Data Mode

```typescript
// Toggle in Settings → saves to user preferences
// Disables: Three.js, animations, video thumbnails, heavy assets

const LowDataModeContext = createContext(false)

// When enabled:
// - Replaces Three.js roadmap with flat SVG
// - Disables Framer Motion animations (instant state changes)
// - Serves WebP images at 50% quality
// - Removes background particle effects
// - Loads Monaco editor in basic mode (no IntelliSense)
// Reduces page weight by ~65%
```

### Optimistic UI Pattern

```typescript
// Every user action feels instant — syncs in background
// Examples: marking problem complete, streak check-in, roadmap progress

const useOptimisticSubmission = () => {
  const [status, setStatus] = useState<'idle'|'submitting'|'success'|'error'>('idle')

  const submit = async (code: string, problemId: string) => {
    // Immediate UI feedback — don't wait for server
    setStatus('submitting')
    updateLocalProgress(problemId) // Update local state instantly

    try {
      const result = await submitToJudge(code, problemId)
      setStatus(result.verdict === 'accepted' ? 'success' : 'error')
      syncProgressToServer(problemId, result) // Background sync
    } catch {
      setStatus('error')
      queueForOfflineSync(code, problemId) // Queue if offline
    }
  }

  return { submit, status }
}
```

### Network Status Component

```typescript
// Persistent banner at top of dashboard when offline
// Never blocks usage — just informs

const NetworkStatus = () => {
  const isOnline = useNetworkStatus()

  if (isOnline) return null

  return (
    <div className="network-banner">
      {/* bg: #1C0A09, text: #FCA5A5, border-bottom: 1px solid #FF4500 */}
      You're offline. Your code is being saved locally and
      will sync when you reconnect.
    </div>
  )
}
```

---

## Doc 21: Trust & Social Proof System

### The Conversion Problem
EYF is unknown. Students won't pay ₹499 for something they can't verify.
Trust is built through verifiable proof, not marketing claims.

### Verified Placement Counter

```typescript
// Real-time counter on landing page
// Updates whenever a user marks 'placement_marked' event

model PlacementCounter {
  id           String @id @default(cuid())
  totalPlaced  Int    @default(0)
  thisMonth    Int    @default(0)
  thisWeek     Int    @default(0)
  lastUpdated  DateTime @default(now())
}

// Landing page counter component
// Animates with countup when entering viewport
// "2,847 students placed using EYF"
// Updates via Server-Sent Events (real-time, no polling)
```

### EYF Hall of Fame

```
Public page: eyf.in/placements
No login required — SEO magnet

Each placement card shows:
  - Student first name + last initial
  - College name + tier
  - Company logo + role
  - EYF prep stats: problems solved, days active, mocks done
  - Days from joining EYF to offer letter
  - Optional: LinkedIn profile link (student chooses)
  - Optional: Placement story link

Filters:
  - By company (Amazon, Flipkart, etc.)
  - By college tier (Tier 1 / 2 / 3)
  - By career track (Backend, Frontend, etc.)
  - By timeline (placed in < 3 months / 3-6 months / 6+ months)

"See students from your college" — college name input → filters to same college
This is the single highest-converting page on the entire site.
```

### Placement Story System

```typescript
// Guided form generates full blog post
// Published on eyf.in/stories/:slug — indexed by Google

model PlacementStory {
  id              String   @id @default(cuid())
  userId          String
  company         String
  role            String
  collegeName     String
  collegeTier     String
  ctcRange        String   // "8-10 LPA" — never exact
  daysOnEYF       Int
  problemsSolved  Int
  mocksCompleted  Int
  keyLearning     String   @db.Text
  adviceToOthers  String   @db.Text
  linkedinUrl     String?
  isPublished     Boolean  @default(false)
  publishedAt     DateTime?
  slug            String   @unique
  views           Int      @default(0)

  user User @relation(fields: [userId], references: [id])
}

// 10-question guided form:
// 1. What was your college and target companies?
// 2. How long did you prepare?
// 3. What was your biggest weak area when you started?
// 4. Which EYF feature helped you most?
// 5. Describe your OA experience
// 6. Describe your technical interview
// 7. What was the turning point in your prep?
// 8. What would you tell someone starting today?
// 9. Advice specific to Tier 2/3 students
// 10. Anything else future EYF students should know?
```

### Live Prep Activity Feed

```typescript
// Anonymised real-time activity on landing page
// Creates FOMO — EYF feels alive on first visit
// Uses Server-Sent Events, updates every 10 seconds

// Examples:
"Rahul S. from VIT just solved Two Sum (Medium)"
"Priya K. from JNTU completed their Amazon mock interview"
"47 students are solving problems right now"
"Mohammed A. just got placed at Flipkart 🎉"
"3 new interview experiences added today"

// Implementation: Redis pub/sub → SSE endpoint → landing page component
// Anonymised: first name + first letter of last name only
// Consent: accepted in Terms of Service at signup
```

### "Students from Your College" Feature

```typescript
// On landing page proof section:
// Input: "Type your college name..."
// Real-time autocomplete from college list
// Shows: "14 students from VIT Bhopal are preparing on EYF.
//         3 have been placed at product companies."
// CTA: "See their stories →" → filtered Hall of Fame

// This is the highest-personalisation touchpoint on the marketing site
// Converts because it removes the "but that's IIT students" excuse
```

---

## Doc 22: Competitor Import & Hub Strategy

### The Insight
Students won't leave LeetCode. Make EYF the hub that gives LeetCode meaning.

### LeetCode Sync

```typescript
// User connects their LeetCode handle in settings
// EYF fetches their solved problems via LeetCode's public API
// Maps each solved problem to EYF's 15 pattern taxonomy

model LeetcodeSyncRecord {
  id              String   @id @default(cuid())
  userId          String
  leetcodeHandle  String
  problemsSynced  Int      @default(0)
  lastSyncedAt    DateTime @default(now())
  patternCoverage Json     // {pattern: count}
}

// After sync, shows:
// "You've solved 127 LeetCode problems.
//  In EYF's pattern system, you've covered:
//  ✅ Arrays (complete), ✅ Two Pointers (complete),
//  ⚠️ Graphs (partial — 6/15 patterns), ❌ DP (not started)
//  Here are your 8 missing patterns with the 3 best problems each."

// This single feature converts 40%+ of LeetCode users who try it
// It gives their existing effort meaning and shows their gaps
```

### Problem Import from Anywhere

```typescript
// Settings → "Import your prep history"
// User pastes a list of problem names/numbers
// OR imports from: LeetCode, GFG, HackerRank (via handle)
// EYF analyses and maps to its pattern system

// Removes cold start problem — student doesn't start at zero
// Their existing work is honoured and built upon
```

### YouTube Resource Integration

```typescript
// Every EYF theory note has a "Best video for this" section
// Curated links to: Striver, Abdul Bari, NeetCode, CS Dojo
// EYF doesn't compete with free content — it curates it
// This makes EYF the hub, not a replacement

model ResourceLink {
  id          String @id @default(cuid())
  conceptId   String
  title       String
  youtubeUrl  String
  channel     String
  durationMins Int
  quality     Int   // 1-5 staff rating
  isVerified  Boolean @default(false)
}

// "Best videos for Sliding Window:"
// Striver - Sliding Window Playlist (2hrs) ★★★★★
// NeetCode - Sliding Window Problems (45min) ★★★★★
// Abdul Bari - Concept Explanation (30min) ★★★★☆
```

### EYF Chrome Extension

```typescript
// Detects: LeetCode, GFG, HackerRank pages
// Shows EYF overlay: "This is a [Pattern] problem"
// Shows: "You've solved X similar problems on EYF"
// Shows: "This is asked by [Company] — you're targeting them"
// CTA: "See your full prep status for this company →"
// Tracks practice across platforms → credits to EYF streak

// Conversion: users who install extension convert to paid at 3× rate
// because EYF is always present in their existing workflow
```

---

## Doc 23: Mental Health & Wellbeing System

### Why This Is a Moat
Placement season drives real mental health crises.
Zero competitors address this. EYF does — and that creates loyalty.

### Mood Tracking System

```typescript
model MoodEntry {
  id        String   @id @default(cuid())
  userId    String
  score     Int      // 1-5 (1=struggling, 5=great)
  note      String?  // optional 1-line note
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
  @@index([userId, createdAt(sort: Desc)])
}

// Daily check-in: 5-second emoji scale
// Shows in dashboard header: subtle mood indicator
// Completely private — never shown to others
// Used only to adapt EYF's behaviour for that user
```

### Adaptive Mode Based on Mood

```typescript
// When mood score is 1-2 for 3 consecutive days:
const activateSupportMode = (userId: string) => {
  // 1. Simplify daily plan: one easy problem only
  // 2. Show "Feeling overwhelmed?" banner (gentle, not alarming)
  // 3. Surface comeback stories from similar situations
  // 4. Reduce notification frequency for 3 days
  // 5. Show: "Many students feel exactly this way at Day 30.
  //    Here's what helped them." — curated, not generic

  // Never:
  // - Force the student to engage with mental health content
  // - Show clinical language or suggest professional help unprompted
  // - Make the student feel abnormal or weak
}

// When mood is consistently 4-5:
const activateGrowthMode = (userId: string) => {
  // Suggest harder problems
  // Show FAANG-level company targets
  // Unlock "challenge mode" for that week
}
```

### Burnout Detection Algorithm

```typescript
// Burnout signal: high activity + declining performance
// Calculated weekly

const calculateBurnoutRisk = (userId: string): 'low' | 'medium' | 'high' => {
  const signals = {
    // Positive stress signals
    dailyHoursIncreasing: checkIfHoursIncreasing(userId),
    accuracyDecreasing: checkIfAccuracyDecreasing(userId),
    lateNightSessions: checkLatNightLoginPattern(userId), // >1 AM logins
    skippedRevisions: checkSkippedSpacedRepetition(userId),
    moodDecline: checkMoodTrend(userId),
    // Negative engagement signals
    shorterSessions: checkIfSessionsDeclining(userId),
    increasedHints: checkHintUsageIncrease(userId)
  }

  const riskScore = calculateWeightedScore(signals)
  return riskScore > 0.7 ? 'high' : riskScore > 0.4 ? 'medium' : 'low'
}

// High burnout risk → proactive message:
// "You've been putting in a lot of work. Research shows
//  taking one rest day improves performance by 23%.
//  [Take a rest day] — your roadmap auto-adjusts."
```

### Rejection Recovery Protocol

```typescript
// When student marks 'rejection' in application tracker:

const triggerRejectionProtocol = async (userId: string, company: string) => {
  // Step 1: Acknowledge (immediate, in-app)
  showMessage("Rejection from " + company + " is data, not failure. Let's figure out what to do next.")

  // Step 2: Debrief form (5 minutes, optional but prompted)
  // "What round did you reach?"
  // "What felt hardest?"
  // "Was there anything that surprised you?"

  // Step 3: AI analysis (if debrief submitted)
  // Cross-reference practice history + round reached + reported difficulty
  // "Based on your history, your most likely gap is:
  //  Graph questions under time pressure (avg 42 min, OA gives 30 min)"

  // Step 4: Comeback story feed
  // Show 3 stories of students who were rejected from same company
  // and eventually got placed there or at equivalent companies

  // Step 5: Next action
  // Specific: "Add 2 timed graph problems to this week's plan"
  // Not generic: "Keep practicing!"
}
```

### Mental Health Resource Centre

```typescript
// eyf.in/wellbeing — no login required, SEO indexed
// Content:
//   "Managing anxiety before campus drives" — 8-minute read
//   "The psychology of rejection in placements" — expert written
//   "Why Tier 2/3 students are not at a disadvantage" — data-backed
//   "How to tell your parents you didn't get placed (yet)" — practical
//   "Burnout vs hard work — knowing the difference" — actionable
//   "Success stories: 8 rejections before Amazon" — real stories

// Partnered with: one licensed counsellor or psychologist
// Monthly live session: free, no login required
// Completely separate from prep content — no upsell on this page ever
```

### Accountability Pod Wellbeing Layer

```typescript
// Weekly pod check-in includes wellbeing question:
// "How are you feeling this week?" (1-5 + optional message)
// Pod members see aggregate: "3/4 members are feeling good this week"
// If any member is at 1-2: gentle prompt to the others
// "One of your pod members might need encouragement this week"
// (Anonymous — no names shown)
```

---

## Doc 24: Post-Placement & Alumni System

### The Placement Flywheel
Every placed student is: proof (conversion), mentor (revenue), content (SEO), and referrer (growth).
This system captures all four simultaneously.

### Placement Journey Card (Viral Asset)

```typescript
// Auto-generated when user marks placement
// Full cinematic journey summary

const generatePlacementCard = (user: User, stats: PlacementStats) => ({
  // Visual: dark card, electric accent, company logo prominent
  headline: `${user.firstName} → ${stats.company}`,
  college: stats.college,
  journey: {
    daysOnEYF: stats.daysActive,
    problemsSolved: stats.totalProblems,
    mocksCompleted: stats.totalMocks,
    streakRecord: stats.longestStreak,
    readinessAtStart: stats.initialScore,
    readinessAtPlacement: stats.finalScore,
    patternsCompleted: stats.patternsCompleted
  },
  quote: user.placementQuote, // prompted after marking placed
  shareText: `I got placed at ${stats.company} using @EYF_in 🎉
              ${stats.problemsSolved} problems. ${stats.daysActive} days.
              ${stats.totalMocks} mock interviews. #EngineerYourFuture #Placed`,
  // Formats: Instagram story (9:16), LinkedIn post (1:1), Twitter card (2:1)
})
```

### Automatic Mentor Invitation Flow

```typescript
// Triggered 24 hours after placement marked
// (gives student time to celebrate before asking anything)

const sendMentorInvitation = async (userId: string, company: string) => {
  await sendEmail({
    to: user.email,
    subject: "You got placed — now help the next student",
    template: 'mentor-invitation',
    data: {
      company,
      earnings: "Earn ₹400–₹800 per session",
      timeCommitment: "As little as 1 session per week",
      impact: "Help students exactly where you were 6 months ago",
      preFilledApplication: buildMentorApplication(userId, company)
    }
  })
}
// Pre-filled: company, role, YOE, expertise tags (from EYF profile)
// Student just reviews and submits — 2-minute process
// Conversion rate: 30%+ of placed students become mentors
```

### Alumni Network

```typescript
// Private Slack-style community (built in EYF, not external)
// Channels auto-created per company

model AlumniChannel {
  id       String @id @default(cuid())
  company  String @unique
  members  Int    @default(0)
  isActive Boolean @default(true)
}

// Amazon channel: placed EYF alumni at Amazon only
// Members can:
//   - Share insider prep tips (current interview patterns)
//   - Refer current EYF students for open roles
//   - Post referral requests from students
// Channels verified: must have offer letter proof to join company channel
```

### Pre-Joining Guide (Extends LTV)

```typescript
// After placement: "You join ${company} in ${days} days. Here's what to prepare."
// Generates a personalised 30/60/90-day pre-joining roadmap

// Content per company:
//   Technical: languages/frameworks used (from company tech stack)
//   Process: onboarding steps, probation expectations
//   Culture: values, communication style, review cycles
//   Community: internal resources, Slack channels to know
//   Practical: laptop setup, tools, accounts to create

// This is a separate product within EYF
// Keeps placed students engaged (LTV extension)
// Becomes a new content category: "Joining [Company] — What to Expect"
// SEO: "How to prepare before joining Amazon" etc.
```

### "Pay It Forward" Program

```typescript
// Placed student can gift 1 month Pro to a current EYF student
// They nominate: "I was helped by [mentor name] — I want to help someone now"
// Or anonymous pool: EYF distributes to students who can't afford Pro
// This is a brand moment — not a revenue play
// Creates deep emotional attachment to EYF from both giver and receiver
```

---

## Doc 25: B2B TPO Product

### The Actual Product a TPO Buys

```
TPO (Training & Placement Officer) Dashboard at: college.eyf.in

LOGIN:
  TPO email + password (separate from student accounts)
  College admin role — can see all enrolled students' data
  (Students consent to this at enrollment via college license)

DASHBOARD VIEWS:

1. BATCH OVERVIEW
   Total enrolled: 287 students
   Active this week: 164 (57%)
   At-risk (< 2 sessions/week): 43 students
   Top performers this week: [leaderboard, top 10]

2. READINESS HEATMAP
   Per company: how many students are "ready," "almost ready," "needs work"
   Visual: company logos grid with green/yellow/red indicators
   "For TCS: 167 students ready, 89 almost ready, 31 needs work"

3. COMPANY DRIVE MANAGEMENT
   TPO registers an upcoming drive:
     Company name, date, eligibility (CGPA, branch, year)
   EYF auto-creates:
     Sprint plan for eligible students
     Push notifications to eligible students
     Drive countdown in student dashboards
     Post-drive: outcome tracking (who got placed)

4. WEEKLY AUTOMATED REPORT (PDF, sent every Monday)
   "Last week, 47% of your batch solved ≥ 3 problems.
    12 students completed mock interviews.
    Top improving students: [names, improvement %]
    Students who need attention: [names, days inactive]
    Predicted placement rate this season: 68% (up from 61% last week)"

5. BULK STUDENT MANAGEMENT
   Upload CSV → EYF creates accounts + sends invites
   Set batch-specific roadmap (company focus relevant to that college)
   Override individual student plans
   Export placement data for NIRF/NAAC reports

6. PLACEMENT OUTCOME TRACKING
   TPO marks placements: who got placed, which company, CTC range
   Feeds EYF's placement DNA and college's public profile
   Used for: college ranking page on eyf.in, testimonials, case studies
```

### TPO Onboarding Flow

```
Day 1: Account created by EYF team
Day 1: 30-minute onboarding call with EYF account manager
Day 1: Bulk student import (CSV upload)
Day 2: Students receive invites, 70%+ activate within 48 hours
Week 1: TPO gets first weekly report
Month 1: Review call — adjust company track focus based on drives calendar
Month 3: First placement outcomes start coming in
Month 6: Renewal conversation with placement data as proof
```

### College Public Profile

```
eyf.in/colleges/vit-bhopal

Shows (publicly, no login):
  - Total EYF students enrolled
  - Placement outcomes (anonymised counts)
  - Top companies students placed at
  - Average readiness score improvement
  - "14 students from this college have been placed using EYF"

This page:
  1. Convinces other TPOs to buy (social proof for B2B sales)
  2. Attracts students from that college (organic acquisition)
  3. Creates FOMO for colleges not on EYF
```

---

## Doc 26: Content Freshness & Market Intelligence

### OA Pattern Freshness System

```typescript
model OAReport {
  id              String   @id @default(cuid())
  userId          String
  company         String
  oaDate          DateTime
  platform        String   // hackerrank | mettl | hirepro | custom
  timeLimit       Int      // minutes
  questions       Json     // [{type, pattern, difficulty, description}]
  outcome         String   // cleared | not_cleared
  notes           String?  @db.Text
  verifiedAt      DateTime?
  isVerified      Boolean  @default(false)
  createdAt       DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
  @@index([company, oaDate(sort: Desc)])
}

// Prompt shown after every mock interview or cognitive game:
// "Did you recently take a real OA? Report it anonymously →"
// Structured 3-minute form
// XP reward: 100 XP for verified OA report

// Staleness indicator on every company track:
// "Last OA report: 8 days ago (based on 12 reports)"
// "⚠️ No recent reports — pattern may be outdated"
```

### Pattern Drift Alert System

```typescript
// Runs nightly — compares last 30 days vs previous 30 days
const detectPatternDrift = async (company: string) => {
  const recent = await getPatternDistribution(company, 30)
  const previous = await getPatternDistribution(company, 60, 30)

  const drifts = findSignificantChanges(recent, previous, threshold: 0.15)

  if (drifts.length > 0) {
    // Alert affected users targeting this company
    await notifyAffectedUsers(company, drifts)

    // Example notification:
    // "Amazon OA update: Graph BFS questions increased from 15% to 34%
    //  of reported questions in the last 2 weeks.
    //  Your prep plan has been adjusted. [See changes →]"
  }
}
```

### Real-Time Hiring Market Dashboard

```typescript
// eyf.in/market — public, no login, updated daily
// Sources: LinkedIn Jobs API + community reports + Naukri API

model HiringStatus {
  id          String   @id @default(cuid())
  company     String
  status      String   // actively_hiring | slow | freeze | unknown
  openRoles   Int?
  lastUpdated DateTime @default(now())
  source      String   // linkedin | community | naukri
  confidence  Float    // 0-1 based on recency + source count
}

// Dashboard shows:
// Company grid with status indicators
// "Amazon — Actively Hiring (47 SDE roles open) — Updated 6 hours ago"
// "Wipro — Hiring Freeze — Last confirmed 3 days ago"
// Monthly India Tech Hiring Report (PDF)
//   Published 1st of each month
//   Distributed to: EYF newsletter, press, LinkedIn
//   Gets cited in articles → backlinks → SEO
```

### Seasonal Prep Awareness

```typescript
// Calendar-aware roadmap adjustments
const PLACEMENT_SEASONS = {
  peak: { start: 'Aug-15', end: 'Nov-30' },  // Campus placement season
  internship: { start: 'Dec-01', end: 'Feb-28' }, // Internship season
  offCampus: { start: 'Mar-01', end: 'Jul-31' }   // Off-campus season
}

// On Aug 1 every year:
// Banner for all students: "Placement season starts in 14 days.
// Students who completed their track before Sept are 3× more likely to get placed.
// [Start your sprint →]"

// Adjusts roadmap pacing: if behind, compresses timeline
// Adds company-specific alerts: "TCS drive expected in your college — typically Sept-Oct"
```

---

## Doc 27: Missing Micro-Features (All Build-Ready)

### 1. "I'm Stuck" Button

```typescript
// Appears after student hasn't typed in editor for 8+ minutes
// Or student can click it manually anytime

const StuckButton = ({ problemId, currentCode }: Props) => {
  const handleStuck = async () => {
    // Analyse what they've written (or haven't)
    const analysis = await analyseStudentCode(currentCode, problemId)

    // Socratic response — never gives solution
    const nudge = await claude.chat({
      system: "You are a patient teacher. Ask one question that helps the student discover the approach themselves. Never reveal the solution or algorithm name.",
      user: `Student is stuck on: ${problem.title}. They've written: ${currentCode || 'nothing yet'}. Give one Socratic nudge.`
    })

    showNudgeOverlay(nudge)
  }

  return <button onClick={handleStuck}>I'm stuck — give me a nudge</button>
}
```

### 2. Interview Countdown Widget

```typescript
// Student can pin upcoming interviews/drives to dashboard
model UpcomingEvent {
  id          String   @id @default(cuid())
  userId      String
  title       String   // "Amazon OA" | "Flipkart Drive" | "HR Round"
  eventDate   DateTime
  company     String
  type        String   // oa | technical | hr | drive
  notes       String?
  isCompleted Boolean  @default(false)
}

// Dashboard widget: "23 days to your Amazon OA"
// Progress ring shows readiness for that specific company
// Daily: "Today's problem is tagged Amazon — relevant to your upcoming OA"
```

### 3. Time-of-Day Personalisation

```typescript
// Adapts content difficulty based on when student studies

const getPersonalisedDailyChallenge = (userId: string, hour: number) => {
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'

  // Morning (6-11 AM): peak cognitive function → Hard problems, new concepts
  // Afternoon (12-5 PM): moderate → Medium problems, practice
  // Evening (6-10 PM): declining → Easy-Medium, revision
  // Night (10 PM+): low → Familiar patterns only, flashcards, theory

  return selectProblemForTimeOfDay(userId, timeOfDay)
}
```

### 4. Keyboard Shortcuts (Power Users)

```typescript
// Cmd+K: Universal command palette (Linear-style)
// Cmd+Enter: Submit code
// Cmd+R: Run against test cases
// Cmd+H: Get hint (if available)
// Cmd+/: Toggle problem description / focus editor
// Cmd+1: Switch to C++ | Cmd+2: Java | Cmd+3: Python
// Cmd+B: Toggle sidebar
// ]: Next problem in roadmap
// [: Previous problem

// Show keyboard shortcut hints on first 3 uses, then hide
// Settings: "Keyboard shortcuts" page with full reference
```

### 5. Code Review Before Submit

```typescript
// Optional toggle: "Review before submit"
// When enabled: before final submission, AI scans code for common issues

const preSubmitReview = async (code: string, problem: Problem) => {
  const issues = await claude.chat({
    system: "You are a senior engineer doing a quick code review. Identify ONLY: 1) Edge cases not handled, 2) Off-by-one errors, 3) Null/empty input not handled. Max 3 issues. Be specific. Don't suggest algorithmic changes.",
    user: `Review this ${language} code for problem: ${problem.title}\n\n${code}`
  })

  // Shows non-blocking overlay:
  // "Before you submit, we noticed:"
  // "• You're not handling the case where nums is empty"
  // "• The loop condition might have an off-by-one at line 8"
  // [Submit anyway] [Let me fix it]
}
```

### 6. "Explain Like I'm 5" Mode

```typescript
// Every theory concept has two modes:
// TECHNICAL: for students with CS background
// SIMPLE: analogies, real-world examples, no jargon

// Example: Deadlock (OS)
const deadlockExplanation = {
  technical: "A deadlock occurs when two or more processes are blocked forever, each waiting for a resource held by the other. The four necessary conditions: mutual exclusion, hold and wait, no preemption, circular wait.",

  simple: "Imagine two people in a hallway, each carrying a box and each needing the other person's box to pass. Neither can move because they're both waiting. That's a deadlock — everyone's stuck waiting for everyone else. In computers, this happens when programs are waiting for each other forever."
}

// Toggle in top-right of every theory page
// "Simple mode" vs "Technical mode"
// Remembers preference per subject
```

### 7. Progress Export

```typescript
// Settings → Export → "Download my EYF journey"
// Generates PDF: full activity history

// Contents:
// - Profile summary (college, target role, subscription period)
// - Problems solved (by difficulty, pattern, company)
// - Assessment history + score progression
// - Mock interview history + feedback scores
// - Streak calendar (GitHub-style heatmap)
// - Certificates earned
// - Placement details (if marked)

// Use cases:
// - Show to parents ("what have you been doing on this app")
// - Reference for scholarship applications
// - Prep for mentor sessions ("here's where I am")
// - Personal milestone document
```

### 8. Weekly Company Newsletter (In-App + Email)

```typescript
// Every Friday, 6 PM IST
// Personalised to user's target company

// Content:
// "This week at Amazon:"
//   - 3 EYF users reported seeing Graph BFS
//   - 2 new salary data points added (SDE-1 range updated)
//   - Amazon drive at 12 colleges next week
//   - 1 new interview experience submitted (Rating: 4.8/5)

// Short, scannable, immediately actionable
// Deeplink every item to relevant EYF section
// "View full Amazon track →" CTA at bottom
```

---

## Doc 28: Legal Documents Specification

### 28.1 Terms of Service — Key Clauses

```
Required before any user signs up:
eyf.in/terms

Critical clauses to include:

CODE SUBMISSION:
  "Code submitted through EYF's editor is not stored
   beyond 90 days and is used solely for execution purposes.
   EYF claims no ownership over submitted code."

COMMUNITY CONTENT:
  "By submitting interview experiences, placement stories,
   or forum posts, you grant EYF a non-exclusive, royalty-free
   license to display this content on the platform.
   You retain ownership. You can request removal at any time."

MENTOR LIABILITY:
  "EYF is a marketplace connecting students with mentors.
   EYF does not guarantee any specific outcome from mentorship
   sessions. Mentors are independent service providers."

PLACEMENT CLAIMS:
  "All placement statistics on EYF are based on self-reported
   data from users. EYF does not independently verify placement
   outcomes and makes no guarantee of placement."

DATA USE:
  "Anonymised, aggregated usage data may be used to improve
   the platform. Individual data is never sold to third parties."

SUBSCRIPTION:
  "Subscriptions auto-renew unless cancelled before the renewal date.
   Refunds are available within 7 days for annual plans if less than
   5% of features have been used."
```

### 28.2 Privacy Policy — DPDP Act 2023 Compliant

```
Required before any data collection begins:
eyf.in/privacy

Key sections:

WHAT WE COLLECT:
  Account data: name, email, phone, college, graduation year
  Usage data: problems solved, time spent, progress
  Device data: browser type, IP address (for security only)
  Payment data: handled entirely by Razorpay — EYF receives no card data

WHAT WE DON'T COLLECT:
  Government IDs, Aadhaar, PAN
  Financial account details
  Medical or health information (mood check-in data is local-only, never synced)

YOUR RIGHTS (DPDP Act 2023):
  Access your data: Settings → Privacy → Download my data
  Correct your data: Settings → Profile
  Delete your data: Settings → Privacy → Delete my account
  Withdraw consent: Settings → Privacy → Manage preferences
  Grievance: privacy@eyf.in (30-day response SLA)

DATA RETENTION:
  Active accounts: data retained indefinitely while account active
  Deleted accounts: all data purged within 30 days
  Backups: purged within 90 days

SUB-PROCESSORS:
  Neon (database), Cloudflare (CDN + storage),
  Clerk (authentication), Razorpay (payments),
  Anthropic (AI features), MSG91 (SMS/OTP),
  PostHog (analytics — anonymised), Resend (email)
```

### 28.3 Refund Policy

```
eyf.in/refund

MONTHLY PLANS:
  No refund on monthly plans (too short a period to justify processing)
  Exception: double-charged — full refund within 24 hours

ANNUAL PLANS:
  Within 7 days of purchase AND < 5% feature usage:
    Full refund, no questions asked
  After 7 days:
    Pro-rated refund for unused months (minimum 1 month charge)
  After 3 months:
    No refund (student has had meaningful access)

ADD-ONS (certificates, expert mocks):
  Expert mock: Refund if mentor cancels. No refund if student cancels < 2 hours before.
  Certificates: No refund (digital delivery, immediate)
  Bootcamp seats: Full refund if cancelled 7+ days before. 50% if 2-7 days. None if < 48 hours.

Process:
  Email: billing@eyf.in
  Response: within 48 hours
  Processing: 5-7 business days to original payment method
```

---

## Doc 29: First 100 Users Playbook

### The Only Metric That Matters in Week 1
Get 100 users who actually use EYF for 7+ days in a row.
Not signups. Not installs. Active users. Everything else is vanity.

### Week 1-2: Manual Founder-Led Acquisition

```
TARGET: 20 beta users who will talk to you weekly

ACTION PLAN:
Day 1-3:
  Identify 50 students on LinkedIn matching:
    - Final year B.Tech CSE
    - Tier 2/3 college
    - "Looking for opportunities" or "Seeking placement" in headline
    - Posted about DSA prep in last 30 days

  DM template (personalised, not copy-paste):
  "Hi [Name], I noticed you're prepping for placements at [College].
   I just built EYF (eyf.in) — a platform specifically for Tier 2/3
   students like us. I'd love 20 minutes of your time to show you
   something new and get your brutal feedback.
   Free Pro access for 3 months in exchange.
   Interested?"

  Expected: 5-10 yes from 50 DMs (10-20% response rate)

Day 4-7:
  Identify 10 active Telegram placement prep groups
    - NIT placement prep, JNTU placements, etc.
  Join as a student, not a founder
  Provide genuine help for 3-5 days before mentioning EYF
  Post: "Built this free tool for placement prep — roast it?"
  Expected: 10-20 more users
```

### Week 3-4: Content Seeds

```
LINKEDIN (daily):
  One genuine placement prep insight per day
  Format: specific, tactical, no-fluff
  Examples:
    "The 3 graph problems that appear in 80% of Amazon OAs (with solutions)"
    "Why solving 300 LeetCode problems didn't get me placed (and what did)"
    "How TCS NQT cognitive section actually works — from 47 student reports"

  Call to action: "I built EYF to solve this. Link in first comment."
  Goal: 5-10 organic signups per post

QUORA (3x per week):
  Answer: "How to prepare for Amazon SDE-1?"
  Answer: "Best resources for TCS NQT?"
  Answer: "How to crack Flipkart SDE interview from Tier 2 college?"
  Always: specific answer first, mention EYF at the end as resource
  Goal: 2-5 organic signups per answer (these age well — SEO gold)

YOUTUBE (1 video):
  Title: "I got placed at [Company] from a Tier 2 college — here's exactly how"
  Content: Honest 15-minute video, beta user as subject
  End: "The platform I used is EYF — link below"
  Goal: 50-200 signups over first month (long tail)
```

### Week 5-6: The First College Deal

```
TARGET: One TPO to give free access to their entire final year batch

EMAIL TEMPLATE to 50 TPOs:
  Subject: "Free placement prep platform for your 2025 batch — no cost, no commitment"

  "Dear [TPO Name],

  I'm reaching out about EYF (eyf.in) — a placement preparation
  platform I built specifically for Tier 2/3 engineering students.

  I'd like to offer your entire 2025 CSE batch:
  - Free Pro access for 3 months
  - Weekly placement readiness report for your office
  - Zero cost, zero obligation to continue

  In return: honest feedback from your students and TPO office.

  10 colleges are already on this offer — I can only take 3 more this semester.

  15-minute call this week?
  [Calendly link]"

  Expected: 3-5 replies, 1-2 calls, 1 college deal
  Result: 200-500 instant users, zero CAC
```

### Week 7-12: Flywheel Starts

```
PLACEMENT STORY ENGINE:
  When first beta user gets placed → record a 5-minute Loom video
  "Here's what Rahul's EYF prep looked like — from Day 1 to offer letter"
  Post to: LinkedIn, YouTube, college WhatsApp groups
  This single video will drive more signups than any ad ever will

REFERRAL PROGRAM ACTIVATION:
  Every user gets a personal referral link
  "Refer a friend who joins → you both get 1 month free"
  In WhatsApp groups: one share from a trusted peer = 10 organic signups

PRODUCT HUNT LAUNCH (Week 8):
  Launch on Tuesday (highest traffic day)
  Prepare: 300-word description, 5 screenshots, demo video
  Ask beta users (now 50+) to upvote at 12:01 AM PST
  Goal: Top 5 product of the day → 500-1000 signups in 24 hours
  This gives EYF instant developer credibility and press mentions

WEEK 12 TARGET:
  500 registered users
  100 active daily users
  10 paid conversions (2% — conservative)
  1 college deal (300+ users)
  1 placement story (proof)
  After this: growth becomes predictable and repeatable
```

---

## Doc 30: Dev Quality & Tooling Stack

### The Complete Pipeline

```
DEVELOPER WRITES CODE
        ↓
Pre-commit (Husky):
  lint-staged (ESLint + Prettier on changed files only)
  tsc --noEmit (type check)
  commitlint (conventional commits: feat:|fix:|chore:)
        ↓
PR OPENED → CI runs all of:
  Vitest (unit + integration tests)
  Playwright (E2E for critical paths)
  SonarQube quality gate (bugs, security, complexity, duplication)
  Lighthouse CI (FCP, bundle size regression)
  Bundlewatch (JS bundle limits)
  Snyk (dependency vulnerabilities)
  TruffleHog (secret scanning)
  Chromatic (visual regression on Storybook components)
  OpenAPI contract validation (spec matches implementation)
  ALL MUST PASS — one failure blocks merge
        ↓
MERGED → Staging auto-deploy:
  DB migrations (Neon staging branch)
  Smoke tests (5 critical user flows)
  k6 load test (50 concurrent users, 2 minutes)
        ↓
PRODUCTION — manual approval:
  DB snapshot → migrations → rolling deploy
  Checkly synthetic monitors (every 5 min from India)
  Sentry error rate alert if > 1% in 30 min → auto rollback
```

### SonarQube Configuration

```properties
# sonar-project.properties
sonar.projectKey=eyf-platform
sonar.sources=apps,packages
sonar.exclusions=**/*.test.ts,**/*.spec.ts,**/node_modules/**,**/.next/**
sonar.qualitygate.wait=true

# Quality gates (PR cannot merge if any fail):
# New code coverage: minimum 70%
# Duplicated lines on new code: < 3%
# Maintainability rating: A
# Reliability rating: A
# Security rating: A
# Security hotspots reviewed: 100%
```

### Skills Integration

```
BEFORE ANY UI COMPONENT:
  Read: /mnt/skills/public/frontend-design/SKILL.md
  Answer: "Is this design unforgettable or generic?"
  Answer: "Does this follow EYF's design philosophy (Doc 02)?"

BEFORE ANY VISUAL ASSET (certificate, share card, poster):
  Read: /mnt/skills/examples/canvas-design/SKILL.md
  Step 1: Write design philosophy (.md)
  Step 2: Create visual asset (.pdf or .png)

BEFORE ANY DOCUMENT GENERATION:
  Read: /mnt/skills/public/docx/SKILL.md (for Word docs)
  Read: /mnt/skills/public/pdf/SKILL.md (for PDFs)
```

---

## FINAL Claude Code System Prompt (Complete — Replace Appendix)

```
You are building EYF (Engineer Your Future) — India's first end-to-end
placement operating system for engineering students.

=== MANDATORY READING BEFORE ANY CODE ===
1. /docs/EYF_Master_Docs.md — All design, product, technical decisions
2. /docs/EYF_Complete_SaaS_Build_Guide.md — All features, architecture
3. /mnt/skills/public/frontend-design/SKILL.md — Before any UI component
4. /mnt/skills/examples/canvas-design/SKILL.md — Before any visual asset

=== DESIGN RULES (never violate) ===
Background: #0A0A0A (dark) | Surface: #111111 | Border: #1C1C1C
Accent: #E8FF47 ONLY — nothing else. Max 10% of any screen.
No purple/indigo/cyan gradients — completely banned
No generic shadcn card grids — banned
No glass morphism, floating orbs, neon glow — banned
No spinners — use skeleton screens
Typography: Geist (display) + Inter (body) + JetBrains Mono (code)
Animations: Framer Motion only, purposeful only (Rule: if you can't explain why it moves, remove it)
Benchmark: apple.com (landing) + linear.app (dashboard)
Error messages: human, specific, actionable — never "Something went wrong"

=== TECHNICAL RULES (never violate) ===
TypeScript strict mode in all files
All DB queries via Prisma — no raw SQL strings ever
User code only executes inside Judge0 Docker containers
Every protected route has requirePlan() middleware
Every submission endpoint has checkSubmissionLimit() middleware
All request bodies validated with Zod
All user-generated content sanitised with DOMPurify
Offline: code autosaves to localStorage every 2 seconds (debounced)
PWA: service worker caches problems and roadmap for offline access
Optimistic UI: every action updates local state before server confirms

=== PLAN GATES ===
free:  5 submissions/day, 100 problems, OS theory, 1 mock/month (no feedback)
basic: 20 submissions/day, 500 problems, all theory (no SQL/LLD), 3 mocks/month (summary)
pro:   unlimited, all 2000+ problems, cognitive games, all mocks + AI feedback,
       all career tracks, resume builder, voice practice, pressure training,
       interview-proof (2 projects), LeetCode sync, offline queue
elite: everything in pro + 2 expert mocks/month + AI career strategist +
       PPO system + Code DNA + unlimited projects + alumni network

=== FOLDER STRUCTURE ===
apps/web        — Next.js 14 App Router (eyf.in, app.eyf.in)
apps/api        — Fastify backend (api.eyf.in)
apps/extension  — Chrome extension
packages/db     — Prisma schema + client
packages/ui     — Shared component library (built in Storybook)
packages/types  — Shared TypeScript types
packages/config — ESLint, Tailwind, TS base configs
docs/           — All planning documents

=== KEY INTEGRATIONS ===
Auth:        Clerk — NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY
DB:          Neon PostgreSQL — DATABASE_URL, DIRECT_URL
Cache:       Upstash Redis — UPSTASH_REDIS_URL, UPSTASH_REDIS_TOKEN
Payments:    Razorpay — RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET
AI:          Anthropic Claude — ANTHROPIC_API_KEY
             (Sonnet for complex tasks, Haiku for simple tasks)
Judge0:      Self-hosted Hetzner — JUDGE0_API_URL, JUDGE0_AUTH_TOKEN
Storage:     Cloudflare R2 — CF_R2_ACCESS_KEY, CF_R2_SECRET_KEY, CF_R2_BUCKET
Email:       Resend — RESEND_API_KEY
SMS/OTP:     MSG91 — MSG91_AUTH_KEY
Analytics:   PostHog — NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST
Monitoring:  Sentry — NEXT_PUBLIC_SENTRY_DSN

=== COLOURS ===
#0A0A0A bg | #111111 surface | #1C1C1C border
#E8FF47 electric | #B8CC38 electric-dim | #1A1F00 electric-bg
#FAFAF9 text-primary | #A1A1AA text-secondary | #52525B text-tertiary
#FF4500 danger | #00FF87 success | #FFB020 warning
#00FF87 easy | #FFB020 medium | #FF4500 hard | #FF0080 expert

=== POSTHOG EVENTS (fire on every action) ===
problem_viewed, code_submitted, submission_limit_hit
mock_started, mock_completed, mock_feedback_viewed
cognitive_session_started, cognitive_session_completed
upgrade_prompt_shown, upgrade_prompt_dismissed
payment_completed, payment_failed
placement_marked (most important event — captures full prep history)

=== INDIA-SPECIFIC REQUIREMENTS ===
Phone OTP login via Clerk (critical — many students have no Google account)
UPI payment prominent in Razorpay (not card-first)
Low-data mode toggle available (reduces page weight 65%)
Code autosave to localStorage (network drops lose nothing)
PWA installable (Android home screen — primary device)
All timers in IST (not UTC) — streak resets midnight IST
Drive alerts via WhatsApp (not just push) — WhatsApp > push in India

=== SEED DATA REQUIRED BEFORE MVP DEMO ===
200 problems: title, slug, difficulty, topics[], patterns[],
              companies[], description, constraints, examples, test cases
15 patterns tagged to problems
30 companies tagged to problems
5 complete editorials
5 BDD test specs (see Doc 30)
3 career tracks: Backend, Frontend, Full Stack
2 assessment question sets (beginner + intermediate)
10 OA fingerprint reports (manual seed for TCS, Amazon, Flipkart)
3 mentor accounts (EYF team members posing as mentors for testing)
```

---

*EYF Gap Resolution Document — All 10 gaps addressed*
*Version 1.0 — Add as Docs 20-30 to EYF_Master_Docs.md*
*Platform is now build-ready. Start with Phase 1 Week 1.*
