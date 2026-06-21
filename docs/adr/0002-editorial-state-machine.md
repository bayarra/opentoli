# ADR-0002: Editorial State and Publication Transitions

- Status: Accepted
- Date: 2026-06-20
- Owners: Project maintainers

## Context

The product specification defines both workflow and review statuses. Payload also has a
native draft/published status. Treating them as interchangeable could expose an AI draft
or permit contradictory records.

## Decision

Use three independent dimensions:

1. Payload `_status` controls public visibility: `draft` or `published`.
2. `workflowStatus` controls editorial progress: `draft`, `needs_review`,
   `needs_discussion`, `reviewed`, `approved`, or `archived`.
3. `reviewStatus` records the strongest review evidence: `not_reviewed`, `ai_draft`,
   `community_reviewed`, `human_reviewed`, or `expert_reviewed`.

A term can transition to `_status: published` only when:

- `workflowStatus` is `approved`;
- `reviewStatus` is `human_reviewed` or `expert_reviewed`;
- a recommended translation exists;
- publication-required sources and validation pass; and
- the actor is a moderator or administrator.

AI jobs may create or update drafts and set `reviewStatus: ai_draft`. They cannot set
`workflowStatus: approved`, set a human review status, or publish. Archiving removes a
term from public visibility without deleting its revision history.

All rejected transition attempts must fail server-side. UI controls are convenience,
not enforcement.

## Consequences

The model carries some intentional state duplication, but each field has one clear
responsibility. Hooks, access rules, and tests must enforce cross-field invariants.

## Alternatives Considered

- One combined status enum: rejected because visibility, workflow, and evidence change
  independently.
- Let votes or AI confidence approve terms: rejected because it violates the trust model.

## References

- [`../ROADMAP.md`](../ROADMAP.md)
- [`../../specs.md`](../../specs.md)
