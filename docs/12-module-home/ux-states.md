# 27.11 · UX States for `/app/home`

`/app/home` must support **all 6** of the following states.

---

## States

### 1. Loading

- Skeleton cards rendered for all 7 blocks
- No real data shown
- No user interaction possible until data loads

### 2. Empty (New User)

- Triggered when: user has no activity, no module progress
- Display:
  - Welcome message
  - Onboarding CTA: "Start your first module"
  - Module grid shown with all cards in `not_started` state
  - Recommendation card: cold-start suggestion

### 3. Active (Normal)

- Full module home rendered with real data
- All 7 blocks visible and functional
- Recommendation card shows engine output
- Recent activity feed populated

### 4. Error

| Element | Value |
|---------|-------|
| Message | "Something went wrong loading your home" |
| Action | Retry button |
| Fallback | Link to open support ticket |

### 5. Locked Feature Overlays

- Applied at module card level (not full page)
- Triggered when: module or feature is `locked` / `partially_locked`
- Overlay shows:
  - Lock icon
  - Reason: "Requires Pro plan"
  - CTA: **Upgrade**

### 6. Plan Upgrade Prompt States

- Triggered when user hits a quota or lock
- Shown as:
  - Inline banner within affected module card
  - Or as a dismissible toast / modal
- Always includes plan required + upgrade CTA

---

## State Priority

```
Loading → (data arrives) → Empty | Active | Error
                                 ↓
                    (locked features) → Overlay on cards
                    (quota hit)       → Upgrade prompt
```

---

## Related

- [Module Card Contract](./module-card-contract.md)
- [UX Requirements](../10-non-functional/ux-requirements.md)
