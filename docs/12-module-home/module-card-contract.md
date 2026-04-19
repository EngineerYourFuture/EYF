# 27.5 · Module Card Contract

Every module card on `/app/home` must implement the **same design contract** across all 5 modules.

---

## Required Elements

| # | Element | Description |
|---|---------|-------------|
| 1 | **Module title + icon** | Display name and representative icon |
| 2 | **One-line purpose** | Single sentence describing the module's value |
| 3 | **Progress indicator** | Percentage complete or milestone count |
| 4 | **Last activity timestamp** | "Last active 2 days ago" |
| 5 | **Primary CTA** | `Start` (if new) or `Continue` (if in progress) |
| 6 | **Access state** | `Unlocked` / `Partially Locked` / `Locked` |
| 7 | **Locked state details** | Reason, required plan, Upgrade CTA |

---

## Access State Behaviour

### Unlocked

- Show progress + CTA normally
- CTA: `Start` or `Continue`

### Partially Locked

- Core features available, premium features locked
- Show which features are locked + upgrade prompt
- CTA: `Continue` (available portion)

### Locked

- Entire module or majority is unavailable
- Show:
  - Reason: e.g., "Available on Pro and above"
  - Plan required
  - CTA: **`Upgrade to Pro`** → billing page

---

## Card States

| State | Behaviour |
|-------|-----------|
| New user | Progress = 0%, CTA = "Start" |
| In progress | Progress > 0%, CTA = "Continue" |
| Locked | Overlay shown, CTA = "Upgrade" |
| Partially locked | Progress shown for unlocked part only |
