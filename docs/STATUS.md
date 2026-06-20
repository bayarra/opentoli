# OpenToli Project Status

**Last updated:** 2026-06-20  
**Current milestone:** M0 - Product and Architecture Baseline  
**Milestone status:** `IN_PROGRESS`  
**Delivery state:** Pre-implementation

## Executive Summary

OpenToli has a detailed product specification and an AI-first, source-grounded content
workflow. No application code, package manifest, database schema, automated tests, or
deployment configuration exists yet. The project is therefore in architecture baseline
work, not implementation or launch preparation.

## Milestone Status

| ID | Milestone | Status | Evidence |
| --- | --- | --- | --- |
| M0 | Product and architecture baseline | `IN_PROGRESS` | Product and AI workflow are specified; technical decisions remain |
| M1 | Application foundation | `PLANNED` | No application scaffold exists |
| M2 | Editorial data core | `PLANNED` | Data requirements exist only in the specification |
| M3 | AI preparation pipeline | `PLANNED` | Workflow and provenance requirements are documented |
| M4 | Reviewer workspace | `PLANNED` | Review behavior is specified; no interface exists |
| M5 | Calibration batch | `PLANNED` | Target and sample ambiguous terms are documented |
| M6 | Public dictionary | `PLANNED` | Required pages are documented |
| M7 | Search and discovery | `PLANNED` | Ranking and filters are documented |
| M8 | Community contributions | `PLANNED` | Roles and contribution features are documented |
| M9 | Launch readiness | `PLANNED` | Launch content and quality gates are documented |

## Achievements

### 2026-06-20

- Created the English-to-Mongolian terminology product specification.
- Defined ten primary terminology categories and a 1,300-candidate content target.
- Defined a launch target of 300 human-reviewed terms and 100 additional drafts.
- Changed the corpus strategy to AI-first, source-grounded preparation.
- Defined research, multi-candidate generation, independent critique, and risk routing.
- Defined AI provenance, dimensional confidence, and human publication safeguards.
- Defined a 50-term calibration batch before larger generation runs.
- Established milestone gates and an AI-agent operating guide.

## Current Work

M0 must resolve the following before application scaffolding:

- Confirm the single Next.js and Payload application topology.
- Select runtime and package-manager versions.
- Select local and production PostgreSQL providers.
- Define CI, test, hosting, background-job, and secrets strategies.
- Formalize the term publication state machine.
- Define English and Mongolian normalization behavior.
- Record the decisions as ADRs.

## Next Actions

1. Create ADR-0001 for application and deployment topology.
2. Create ADR-0002 for editorial state and publication transitions.
3. Document selected runtime, package manager, database, hosting, and CI versions.
4. Mark M0 `DONE` only after its roadmap exit criteria are evidenced.
5. Mark M1 `READY` and scaffold the application.

## Blockers

No active blocker is recorded. M0 contains unresolved decisions, but each has a
reasonable default and can be resolved during baseline work.

## Risks

| Risk | Impact | Current mitigation |
| --- | --- | --- |
| AI output sounds natural but is technically wrong | Loss of trust | Independent critique and domain review routes |
| AI pipeline cost grows during batch generation | Budget pressure | Calibration batch, idempotent jobs, and cost metrics |
| Conflicting status fields permit accidental publication | Data exposure | Formal publication state machine required in M0 |
| Search leaks drafts | Unreviewed content becomes public | Public-query and authorization tests required in M2 and M7 |
| Content work outpaces reviewer capacity | Large unreviewed backlog | Batches of 100 to 200 after calibration |

## Update Log Template

Add new entries above older entries under `Achievements`:

```markdown
### YYYY-MM-DD

- Completed: <observable outcome>
- Evidence: <test, command, file, page, migration, or deployment>
- Decision: <ADR link, when applicable>
- Remaining: <next incomplete acceptance criterion>
```

Do not report an achievement as complete when only its design or scaffold exists.

