# 27.7 · Recommendation System (Module-Aware)

The recommendation engine must be module-aware — it should not only suggest DSA problems, but can recommend actions across all 5 modules.

---

## Required Output Fields

| Field | Description |
|-------|-------------|
| `recommended_module` | Which module the action belongs to |
| `recommended_action` | What the user should do |
| `reason_code` | Machine-readable reason (e.g., `WEAK_TOPIC_RECOVERY`) |
| `difficulty_or_level` | Difficulty (DSA) or level (Skills/Subjects) |
| `estimated_effort` | Approximate time to complete |

---

## Example Outputs

| Example | Module | Reason |
|---------|--------|--------|
| "Continue DSA → Arrays medium problem" | DSA Practice | `WEAK_TOPIC_RECOVERY` |
| "Resume Builder → Add 2 project bullets to reach 80% completeness" | Resume Builder | `PROFILE_COMPLETENESS` |
| "Core Subjects → Revise DBMS normalization before mock" | Core Subjects | `MOCK_PREP_GAP` |
| "Placement Prep → Complete this week's mock interview" | Placement Prep | `MOCK_DUE` |
| "Tech Skills → Complete React checkpoint 3" | Tech Skills | `ROADMAP_ADHERENCE` |

---

## Reason Codes

| Code | Description |
|------|-------------|
| `WEAK_TOPIC_RECOVERY` | User struggling with a topic — suggest easier problem |
| `STRONG_TOPIC_PROGRESSION` | User excelling — increase difficulty |
| `PROFILE_COMPLETENESS` | Resume below completeness threshold |
| `MOCK_PREP_GAP` | Knowledge gap identified before an upcoming mock |
| `MOCK_DUE` | Mock interview scheduled or overdue |
| `ROADMAP_ADHERENCE` | User deviating from their chosen skill roadmap |
| `STREAK_MAINTENANCE` | User at risk of losing streak |
| `COLD_START` | New user — suggest easy entry point per module |

---

## API Endpoints

- `GET /api/v1/home/recommendation` — single best next action
- Replaces / extends the existing `GET /api/v1/recommendations/next` (DSA-only)

---

## Related

- [Recommendation Engine v1](../05-functional-requirements/recommendation-engine.md)
- [API Additions](./api-additions.md)
