# 27.4 · Module Home Screen (`/app/home`)

**Goal:** Give users a clear "control center" to pick what they want to do next.

---

## Screen Blocks (Top to Bottom)

### Block 1 · Welcome Header

| Element | Description |
|---------|-------------|
| Greeting | Personalised greeting ("Good morning, Praneeth") |
| Motivation line | Short dynamic motivational message |
| Current plan badge | Displays `Free` / `Basic` / `Pro` / `Elite` |

---

### Block 2 · Progress Snapshot

| Element | Shown For |
|---------|-----------|
| XP total | All plans |
| Current streak (days) | All plans |
| Daily submissions used / remaining | All plans |
| Mentorship sessions used / quota | Pro + Elite only |

---

### Block 3 · Start Here Recommendation Card

| Element | Description |
|---------|-------------|
| Recommended next action | Single action from recommendation engine |
| Module it belongs to | e.g., "DSA Practice" |
| Reason | e.g., "Weak topic recovery — Arrays" |
| CTA | **"Start Now"** |

---

### Block 4 · Module Grid (5 Cards)

All 5 modules rendered as cards. See [Module Card Contract](./module-card-contract.md).

| Module | Key CTA |
|--------|---------|
| DSA Practice | Start / Continue |
| Core Subjects | Start / Continue |
| Placement Prep | Start / Continue |
| Resume Builder | Start / Continue |
| Tech Skills | Start / Continue |

---

### Block 5 · Recent Activity Feed

| Element | Description |
|---------|-------------|
| Activity items | Latest attempts, resume updates, completed topics |
| Item format | Module icon + action + timestamp |
| Limit | Last 5–10 items |

---

### Block 6 · Plan Lock States

| State | Display |
|-------|---------|
| Feature locked | Overlay on locked module or section |
| Upsell message | "Unlock [feature] with Pro" |
| CTA | **Upgrade** → billing page |

---

### Block 7 · Quick Actions

| Action | Behaviour |
|--------|-----------|
| Continue last activity | Deep link to last open module/task |
| Open support | Opens support ticket form |
| View plan | Opens plan comparison / billing page |
