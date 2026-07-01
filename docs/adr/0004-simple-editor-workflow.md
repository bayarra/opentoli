# ADR-0004: Simple Editor Workflow

- Status: Accepted
- Date: 2026-06-21
- Owners: Project maintainers

> Amendment (2026-06-29): source and internal-route gating below is superseded by
> [ADR-0005](0005-optional-reference-provenance.md).
>
> Amendment (2026-06-29): the Draft Inbox is named Review Queue. Evaluation outcomes are
> captured with the same Publish or Hide transaction, while AI Quality is read-only reporting.
>
> Amendment (2026-06-30): AI continues to generate alternatives and examples. The Review Queue
> exposes the same non-rejected content as Community Review and lets Editors choose the subset
> that `Publish` materializes as canonical Translations and Examples.

## Context

The first M4 reviewer implementation exposed separate accept, modify, reject, reroute, and
merge actions plus route-specific reviewer requirements. Although auditable, that workflow
made the MVP harder to understand and operate than the product needs.

## Decision

Use one visible editorial workflow:

```text
AI Draft -> Editor edits -> Publish
```

The editor works from one Review Queue. Headword, recommended translation, explanations,
alternative translations, and bilingual examples save in the background. `Publish` is the only
primary decision and is always an explicit human action.
`Hide` is a secondary inbox-management action that preserves the draft and all provenance.
When the draft belongs to an active evaluation set, the same page asks one compact quality
question. The answer and editorial decision commit together. AI Quality aggregates those
records but does not expose a second outcome form.

Visitors may read explicitly public unverified drafts. Members may submit moderated
feedback. Editors may edit and publish. Existing granular editorial roles are treated as
compatibility aliases for Editor rather than separate workflows.

Risk, confidence, critique, route, provider, prompt, source, and generation metadata remain
available internally for provenance and quality analysis. They do not create visible review
stages or publication confirmations. Optional references and internal routes do not gate an
Editor's explicit publication decision.

Publishing atomically records the editor, field changes, and any required evaluation outcome,
materializes the Editor-kept recommended translation, alternatives, and examples as canonical
content, and publishes it. AI and community actions still cannot publish.

## Consequences

Editors have one queue, one editable page, and one main action. Training and operational
cost are lower. Advanced multi-reviewer routing and merge tools are deferred until real
usage demonstrates a need.

The application must keep audit and provenance automatically so simplicity does not weaken
the human-publication boundary.

## References

- [`0002-editorial-state-machine.md`](0002-editorial-state-machine.md)
- [`0003-public-ai-drafts-and-feedback.md`](0003-public-ai-drafts-and-feedback.md)
- [`0005-optional-reference-provenance.md`](0005-optional-reference-provenance.md)
- [`../ROADMAP.md`](../ROADMAP.md)
- [`../../specs.md`](../../specs.md)
