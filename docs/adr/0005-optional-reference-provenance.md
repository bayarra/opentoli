# ADR-0005: Optional Reference Provenance

- Status: Accepted
- Date: 2026-06-29
- Owners: Project maintainers

## Context

AI preparation references commonly explain the English concept, but they do not necessarily
contain or validate the proposed Mongolian wording. Requiring an Editor to verify such a link
before publishing overstates its evidentiary value and complicates the simple workflow.

## Decision

Use only optional background references in the active product workflow. References have a title
and safe URL; they have no verification state, evidence status, required type, calibration
assessment, or effect on AI routing, public feedback, and publication.

The Payload collection slug, historical AI schema keys, and migration columns may retain the
word `source` solely for backward compatibility with existing provenance. New web and `/api/v1`
contracts use `reference` or `references`.

Safe HTTP(S) references may appear in the public projection when present. Unsafe URLs and raw
AI evidence remain private. AI and community actions still cannot publish canonical content;
the explicit attributed Editor action remains the publication boundary.

## Consequences

Editors judge the wording directly without an artificial evidence workflow. References remain
useful for navigation and later audit but are visually secondary. Removing a reference cannot
change draft visibility or publication state.

## References

- [`0002-editorial-state-machine.md`](0002-editorial-state-machine.md)
- [`0004-simple-editor-workflow.md`](0004-simple-editor-workflow.md)
- [`../ROADMAP.md`](../ROADMAP.md)
- [`../../specs.md`](../../specs.md)
