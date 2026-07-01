# ADR-0003: Public AI Drafts and Authenticated Community Feedback

- Status: Accepted
- Date: 2026-06-20
- Owners: Project maintainers

> Amendment (2026-06-30): authenticated community contributions now appear immediately.
> Editors retain a post-publication Hide action; community input remains advisory and cannot
> mutate canonical terminology.

## Context

OpenToli should let the public improve terminology before formal review. The canonical
publication rules in ADR-0002 must still prevent generated or community-proposed content
from being mistaken for verified terminology. Raw AI evidence and public submissions also
carry privacy, abuse, and information-quality risks.

## Decision

Treat public visibility and canonical publication as separate states.

An AI Draft may expose an explicitly enabled, redacted public projection labeled
`Unverified AI Draft`. Public visibility never changes a Term's Payload `_status`, never
marks content human reviewed, and never selects a recommended translation. Blocked,
rejected, failed, and private drafts cannot expose a public projection.

The projection may show candidate wording, draft explanations, examples, citations, and
approved community feedback. It excludes raw provider responses, prompts, job failures,
private review notes, contact information, and abuse-prevention metadata. Unverified draft
pages use `noindex` and are excluded from the canonical sitemap.

Anyone may view an explicitly public AI draft without an account. Commenting and suggesting
terminology require a registered, authenticated user. Every contribution is attributed,
rate limited, duplicate screened, validated, and displayed immediately. It cannot directly
modify AI Drafts, Terms, Translations, Examples, or References. Editors may hide unsafe or
abusive content after publication.

## Consequences

OpenToli gains an early public feedback loop and can collect language evidence during
calibration. The application must build a safe projection rather than opening the AI
Draft collection directly, and it must operate rate limits, validation, post-publication
Hide controls, privacy retention, and accessibility for public forms.

Reviewers remain responsible for interpreting feedback. Votes, comment volume, and AI
confidence remain advisory and cannot authorize publication.

## Alternatives Considered

- Keep all AI drafts private: rejected because it prevents the requested open feedback loop.
- Expose complete AI Draft and Generation Job records: rejected because raw evidence can contain sensitive or unsafe internal data.
- Allow anonymous submissions: rejected because authentication provides accountability, ownership, and stronger abuse controls.
- Require approval for every authenticated contribution: rejected because community input is
  clearly separate from canonical terminology and the extra queue adds unnecessary friction.

## References

- [`0002-editorial-state-machine.md`](0002-editorial-state-machine.md)
- [`../ROADMAP.md`](../ROADMAP.md)
- [`../../specs.md`](../../specs.md)
