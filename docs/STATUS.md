# OpenToli Project Status

**Last updated:** 2026-06-21
**Current milestone:** M4 - Public Draft Feedback and Reviewer Workspace
**Milestone status:** `IN_PROGRESS`
**Delivery state:** Public draft feedback vertical slice complete; reviewer workspace next

## Executive Summary

OpenToli now has a buildable Next.js and Payload application plus its first complete
database-backed terminology slice. Terms, translations, sources, examples, reviews, and
import batches are modeled. The published `authentication` reference term is searchable
in English and Mongolian, appears in its category, and has a responsive detail page.
Publication guards, clean migrations, seeding, integration tests, and browser checks pass.
M3 has private AI Draft and Generation Job persistence, versioned structured-output
contracts, provider-neutral staged execution, idempotent enqueueing, retry resumption,
risk routing, retained provenance, and deterministic end-to-end evidence. Its live OpenAI
calibration retry remains open. M4 has now started with an explicit safe public projection,
unverified draft page, registration and sign-in, authenticated pending feedback, moderation,
duplicate screening, and contributor throttling. Reviewer comparison and decision actions
remain before M4 can close.

## Milestone Status

| ID  | Milestone                                    | Status        | Evidence                                                                                                   |
| --- | -------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------- |
| M0  | Product and architecture baseline            | `DONE`        | ADR-0001 and ADR-0002 record the accepted baseline                                                         |
| M1  | Application foundation                       | `DONE`        | Clean migration, seed, tests, build, HTTP, and browser evidence recorded                                   |
| M2  | Editorial data core                          | `DONE`        | Attributed reviewer/moderator workflow and public vertical slice verified                                  |
| M3  | AI preparation pipeline                      | `IN_PROGRESS` | OpenAI adapter contract tests pass; live calibration retry remains                                         |
| M4  | Public draft feedback and reviewer workspace | `IN_PROGRESS` | Redacted draft page, contributor auth, moderation persistence, migration, and 4 integration scenarios pass |
| M5  | Calibration batch                            | `PLANNED`     | Target and sample ambiguous terms are documented                                                           |
| M6  | Public dictionary                            | `PLANNED`     | Required pages are documented                                                                              |
| M7  | Search and discovery                         | `PLANNED`     | Ranking and filters are documented                                                                         |
| M8  | Community accounts and contributions         | `PLANNED`     | Rich contributor features extend the basic authenticated M4 feedback path                                  |
| M9  | Launch readiness                             | `PLANNED`     | Launch content and quality gates are documented                                                            |

## Achievements

### 2026-06-21

- Added explicit moderator-controlled public visibility for sourced, non-blocked `needs_review` AI Drafts.
- Added a narrow public projection that excludes raw research, generated payloads, critique, jobs, provider and prompt metadata, and unsafe citation URLs.
- Added `/drafts/[id]` with persistent `Unverified AI Draft` labeling and `noindex` metadata.
- Added public contributor registration and sign-in without exposing Payload's post-bootstrap Users create endpoint.
- Added friendly duplicate-email registration handling with a race-safe `409` response instead of logging an expected database error.
- Added a session-aware `/contribute` page and redirected authenticated users away from login and registration forms.
- Added pending-by-default comments and translation suggestions with owner access, moderator decisions, duplicate screening, and a five-per-ten-minute contributor limit.
- Added and locally applied `20260621_185717_m4_public_draft_feedback`.
- Clean-database forward migration and the M4 down migration passed against a disposable PostgreSQL database.
- Expanded database integration coverage to 7 files and 23 passing tests.
- Verified `/`, `/register`, and `/login` return `200`, while a nonexistent public draft returns `404`.
- Added and passed an authenticated Playwright regression proving logged-in users see contribution guidance rather than a create-account prompt.

### 2026-06-20

- Added the official OpenAI SDK and a `gpt-5-mini` Responses API adapter with strict structured outputs.
- Added provider selection from server-only environment variables and switched both AI CLI scripts to it.
- Added mocked request, schema, usage, failure, and provider-factory coverage without paid CI calls.
- Retained live OpenAI job 33 after a strict-schema rejection, fixed inferred `const`/`enum` types, and left it retryable.
- Expanded database integration coverage to 6 files and 19 passing tests.
- Added a provider-neutral AI interface and deterministic provider with versioned prompt metadata.
- Added atomic job claiming, staged output retention, retry resumption, usage accounting, and crash recovery.
- Added risk routing that blocks unsourced drafts and requires domain review for high-risk categories.
- Ran `authentication` end to end: job 11 and private draft 5 are `needs_review/language_review`.
- Re-ran `authentication` idempotently and reused job 11 and draft 5 without provider work.
- Expanded database integration coverage to 5 files and 16 passing tests.
- Accepted ADR-0003: anyone may view an unverified redacted AI draft, while contributing requires authentication and moderation.
- Added private AI Drafts and Generation Jobs collections with provenance, retry, and idempotency fields.
- Added versioned research, generation, and critique JSON Schemas with runtime validation.
- Enforced completed-job evidence before AI draft creation and retained the human publication boundary.
- Disabled automatic database schema push so committed migrations are authoritative in development and CI.
- Generated and clean-database validated the M3 AI foundation migration.
- Expanded database integration coverage to 4 files and 12 passing tests.
- Made editorial integration tests self-contained on a migrated database; seed data is no longer a test prerequisite.
- Added Terms, Translations, Sources, Examples, Reviews, and Import Batches collections.
- Added server-side publication guards and public draft isolation.
- Generated and clean-database validated the editorial-core migration.
- Seeded a sourced `authentication` reference term with translations and an example.
- Replaced placeholder search and category pages with PostgreSQL-backed results.
- Added the responsive `/terms/[slug]` detail page.
- Verified English and Mongolian search-to-term navigation in clean Chrome with no console issues.
- Verified attributed reviewer/moderator publication and contributor denial.
- Expanded database integration coverage to 3 files and 8 passing tests.
- Switched seeding to Payload's supported script runner so the command exits without lingering processes.
- Fixed standalone seed environment loading and seeded all 10 primary categories.
- Ran the database-backed integration suite successfully: 2 files and 3 tests passed.
- Verified homepage, search, category, and admin routes in clean Chrome at desktop and mobile sizes.
- Added the OpenToli app icon and confirmed its SVG response returns `200`.
- Removed invalid nested `main` landmarks from the public layout.
- Verified the homepage in a clean Chrome profile with no hydration warnings.
- Scaffolded the official Payload 3.85.1 blank application with Next.js 16 and PostgreSQL.
- Added a responsive OpenToli homepage, search placeholder, and category placeholders.
- Added role-aware Users plus Categories and Contexts Payload collections.
- Added an idempotent bilingual seed definition for all ten primary categories.
- Added PostgreSQL 17 Docker configuration and environment examples.
- Added GitHub Actions quality gates, runtime pins, Vitest, and Playwright configuration.
- Recorded application topology and editorial state decisions in ADR-0001 and ADR-0002.
- Verified generated Payload types, TypeScript, ESLint, two domain tests, and production build.
- Smoke-tested `/` and `/search?q=authentication` over HTTP with successful `200` responses.
- Created the English-to-Mongolian terminology product specification.
- Defined ten primary terminology categories and a 1,300-candidate content target.
- Defined a launch target of 300 human-reviewed terms and 100 additional drafts.
- Changed the corpus strategy to AI-first, source-grounded preparation.
- Defined research, multi-candidate generation, independent critique, and risk routing.
- Defined AI provenance, dimensional confidence, and human publication safeguards.
- Defined a 50-term calibration batch before larger generation runs.
- Established milestone gates and an AI-agent operating guide.

## Verification

| Check                      | Result      | Evidence                                                                                                               |
| -------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------- |
| Payload type generation    | Pass        | `pnpm generate:types`                                                                                                  |
| TypeScript                 | Pass        | `pnpm typecheck`                                                                                                       |
| ESLint                     | Pass        | `pnpm lint`                                                                                                            |
| Slug normalization tests   | Pass        | 2 tests in `formatSlug.int.spec.ts`                                                                                    |
| Production build           | Pass        | Next.js generated all current public and Payload routes                                                                |
| HTTP smoke test            | Pass        | `/` and `/search?q=authentication` returned `200`                                                                      |
| Hydration smoke test       | Pass        | Clean Chrome profile produced no hydration warning                                                                     |
| Database integration       | Pass        | 23 self-contained integration tests in 7 files pass against PostgreSQL without requiring seed data                     |
| Public draft feedback      | Pass        | 4 scenarios verify projection redaction, registration roles, pending moderation, throttling, and resolved-draft hiding |
| OpenAI adapter contract    | Pass        | 3 mocked tests verify strict Responses API requests, parsing, usage, and failures                                      |
| OpenAI live calibration    | Pending     | Job 33 retained the initial schema error; fixed adapter awaits retry                                                   |
| Migration reproducibility  | Pass        | All 4 migrations apply from zero; the M4 down migration also passes                                                    |
| Local HTTP smoke           | Pass        | `/`, `/register`, and `/login` return `200`; an unknown draft returns `404`                                            |
| M4 auth browser regression | Pass        | 4 admin/browser tests pass, including authenticated `/contribute` session recognition                                  |
| Historical full rollback   | Known issue | M2 `editorial_core` down migration has an existing lock-relation drop-order defect                                     |

## Current Work

The first M4 public-feedback slice is complete. M4 remains in progress because the reviewer
workspace, candidate comparison, risk-route enforcement at decision time, merge behavior,
and accessibility/browser evidence are not complete. The M3 live calibration evidence also
remains open and is tracked in parallel because M4 was started by explicit direction.

## Next Actions

1. Build the M4 reviewer workspace with side-by-side evidence, candidate, critique, and feedback views.
2. Enforce required reviewer expertise and risk routes on accept, modify, reject, reroute, and merge actions.
3. Record field-level outcomes, reasons, attribution, and canonical Term materialization without automatic publication.
4. Add keyboard/accessibility and visual browser checks for public draft, auth, feedback, and reviewer flows.
5. Retry live M3 job 33 and record token, latency, validation, and reviewer-quality evidence.
6. Repair and separately validate the historical M2 down migration ordering defect.

## Blockers

No active blocker is recorded.

## Risks

| Risk                                                    | Impact                                    | Current mitigation                                                                             |
| ------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------- |
| AI output sounds natural but is technically wrong       | Loss of trust                             | Independent critique and domain review routes                                                  |
| AI pipeline cost grows during batch generation          | Budget pressure                           | Calibration batch, idempotent jobs, and cost metrics                                           |
| Conflicting status fields permit accidental publication | Data exposure                             | Formal publication state machine required in M0                                                |
| Search leaks drafts                                     | Unreviewed content becomes public         | Public-query and authorization tests required in M2 and M7                                     |
| Content work outpaces reviewer capacity                 | Large unreviewed backlog                  | Batches of 100 to 200 after calibration                                                        |
| Public feedback attracts spam or abuse                  | Moderation load and unsafe public content | Authentication, pending-by-default submissions, rate limits, screening, and moderator controls |

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
