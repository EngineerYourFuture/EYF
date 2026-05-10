# 27.2 · Navigation & Routing

---

## Entry Points

### Public Entry

| Route | Destination |
|-------|------------|
| `/` | Landing page (marketing + conversion) |
| `/auth/login` | User login |
| `/auth/register` | User registration |
| `/authority/login` | Staff / Admin separate entry |

### Authenticated User Entry

| Rule | Value |
|------|-------|
| Default post-login route | `/app/home` |
| Mandatory | ✅ `/app/home` must **not** be skipped under any condition |

### Authority Entry

| Route | Destination |
|-------|------------|
| `/authority/login` | → `/authority/queue` (or role-specific dashboard) |

---

## 27.8 · Routing Rules (User App)

| # | Rule |
|---|------|
| 1 | After successful login, **always redirect to `/app/home`** |
| 2 | If user left an unfinished critical task, show "Continue where you left off" card on home |
| 3 | Deep links to module routes must still pass RBAC + entitlement checks |
| 4 | Session revoked state can interrupt **any** route and force re-login |

---

## Module Route Map

| Module | Route |
|--------|-------|
| Home | `/app/home` |
| DSA Practice | `/app/dsa` |
| Core Subjects | `/app/subjects` |
| Placement Prep | `/app/placement` |
| Resume Builder | `/app/resume` |
| Tech Skills | `/app/skills` |
