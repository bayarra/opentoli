# ADR-0005: Optional Reference Provenance

- Status: Accepted
- Date: 2026-06-29
- Owners: Project maintainers

## Context

AI preparation references commonly explain the English concept, but they do not necessarily
contain or validate the proposed Mongolian wording. Requiring an Editor to verify such a link
before publishing overstates its evidentiary value and complicates the simple workflow.

## Decision

Treat sources as optional background references and retained AI provenance. A missing,
unverified, or internally blocked reference state does not prevent an Editor from opening an
active draft for public feedback or explicitly publishing it.

Safe HTTP(S) references may appear in the public projection when present. Unsafe URLs and raw
AI evidence remain private. AI and community actions still cannot publish canonical content;
the explicit attributed Editor action remains the publication boundary.

## Consequences

Editors judge the wording directly without completing an artificial reference-verification
stage. References remain useful for context and later audit but are visually secondary.
Important factual claims may still benefit from references, but this is editorial judgment,
not a universal system gate.

## References

- [`0002-editorial-state-machine.md`](0002-editorial-state-machine.md)
- [`0004-simple-editor-workflow.md`](0004-simple-editor-workflow.md)
- [`../ROADMAP.md`](../ROADMAP.md)
- [`../../specs.md`](../../specs.md)
