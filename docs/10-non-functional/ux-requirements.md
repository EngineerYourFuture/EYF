# UX Requirements

**Section 16 of PRD.**

---

## Required States (All Critical Screens)

Every critical screen must implement all four states:

| State | Requirement |
|-------|-------------|
| **Loading** | Skeleton or spinner shown while data is fetching |
| **Empty** | Helpful empty state with action (e.g., "Solve your first problem") |
| **Error** | Clear error message + retry option |
| **Success** | Confirmation of action with clear next step |

---

## Responsiveness

| Breakpoint | Behaviour |
|------------|-----------|
| ≥ 1024px | Full layout |
| < 1024px | Single-column adaptation |

---

## Forms

- Inline validation on all form fields
- Clear retry affordance on submission errors
- No silent failures

---

## CTAs

- High-contrast primary CTAs
- Upgrade prompts must be visible but non-intrusive

---

## Accessibility

- Keyboard-navigable all interactive elements
- Accessible labels on all inputs and buttons
- ARIA attributes where needed
