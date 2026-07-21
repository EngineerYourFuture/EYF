# Architecture Decision Records (ADRs)

Short, immutable records of decisions that shape the architecture or product direction —
the *why* behind choices a new engineer would otherwise have to reverse-engineer.

## When to write one

Write an ADR for a **durable** decision: architecture, data model, a tool/vendor choice, a
security posture, or a reversal of a previous decision. Not for turn-level or trivial choices.
Per `CLAUDE.md`, architecture-affecting changes must add or update an ADR.

## Convention

- File name: `NNNN-kebab-title.md` (zero-padded, sequential).
- Never edit an accepted ADR's decision — supersede it with a new one (`Supersedes:` /
  `Superseded by:` links). ADRs are a history, not a wiki.
- Sections: Context → Decision → Consequences. Keep it to one page.

## Log

| # | Title | Status | Date |
|---|-------|--------|------|
| [0001](0001-proof-loop-sequenced-hybrid.md) | Proof Loop: capture the skill→outcome graph via a sequenced hybrid | Accepted | 2026-07-21 |
