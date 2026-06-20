# OpenToli Agent Guide

This file is the entry point for AI coding agents working in this repository.

## Read First

Read these documents in order before changing code:

1. [`specs.md`](specs.md) - product requirements and constraints
2. [`docs/ROADMAP.md`](docs/ROADMAP.md) - delivery order and milestone gates
3. [`docs/STATUS.md`](docs/STATUS.md) - current progress, next actions, and blockers

If the documents disagree, the product specification governs product behavior, the
roadmap governs delivery order, and the status document governs what is currently in
progress. Do not silently resolve a material conflict; record the decision or raise it.

## Working Rules

- Work on the active milestone in `docs/STATUS.md` unless explicitly directed otherwise.
- Prefer the smallest vertical slice that satisfies the current milestone exit criteria.
- Do not mark work complete without verifiable evidence such as tests, migrations,
  screenshots, or a working end-to-end flow.
- Preserve AI provenance and the human-publication boundary defined in `specs.md`.
- Never create a path that allows generated content to publish automatically.
- Keep unrelated refactors out of milestone work.
- Add or update tests in proportion to the behavior changed.
- Record architectural decisions that are difficult to reverse as ADRs under
  `docs/adr/` using the template in that directory.

## Status Updates

At the end of a meaningful work session:

1. Update `docs/STATUS.md` with achievements, evidence, next actions, and blockers.
2. Change milestone status only when its entry and exit conditions are satisfied.
3. Link to concrete artifacts instead of reporting estimated completion percentages.
4. Use ISO 8601 dates (`YYYY-MM-DD`).

## Delivery Standards

Before a milestone can be marked `DONE`:

- Its acceptance criteria pass.
- Required automated tests pass.
- Relevant documentation and migrations are committed with the change.
- Security, accessibility, and observability implications have been considered.
- `docs/STATUS.md` contains evidence of completion.

