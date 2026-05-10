# 28 · Recommendation Engine Specification

> **Objective:** Produce exactly one deterministic next-action recommendation per user request. Computed on backend only. Returns stable output for the same input snapshot.

---

## Files in This Section

| File | Description |
|------|-------------|
| [inputs.md](./inputs.md) | Authoritative input signals |
| [scoring-model.md](./scoring-model.md) | Deterministic scoring formula + weights |
| [component-definitions.md](./component-definitions.md) | Per-module component definitions |
| [priority-resolution.md](./priority-resolution.md) | Ranking, tiebreaker rules, cold-start, conflict resolution |
| [output-contract.md](./output-contract.md) | Output JSON schema + pseudocode |
