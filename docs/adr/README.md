# Architecture Decision Records

Use Architecture Decision Records for choices that are costly to reverse or affect
multiple milestones. Name files sequentially, for example:

```text
0001-application-deployment-topology.md
0002-editorial-state-machine.md
```

Use this template:

```markdown
# ADR-NNNN: Decision title

- Status: Proposed | Accepted | Superseded | Deprecated
- Date: YYYY-MM-DD
- Owners: Project maintainers

## Context

What problem or constraint requires a decision?

## Decision

What was selected?

## Consequences

What improves, what becomes harder, and what follow-up work is required?

## Alternatives Considered

What credible alternatives were rejected, and why?

## References

Links to requirements, evidence, or related ADRs.
```
