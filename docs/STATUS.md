# OpenToli Project Status

**Last updated:** 2026-06-20
**Current milestone:** M3 - AI Preparation Pipeline
**Milestone status:** `IN_PROGRESS`
**Delivery state:** AI persistence and schema foundation complete

## Executive Summary

OpenToli now has a buildable Next.js and Payload application plus its first complete
database-backed terminology slice. Terms, translations, sources, examples, reviews, and
import batches are modeled. The published `authentication` reference term is searchable
in English and Mongolian, appears in its category, and has a responsive detail page.
Publication guards, clean migrations, seeding, integration tests, and browser checks pass.
M3 now has private AI Draft and Generation Job persistence, versioned structured-output
contracts, idempotency and retry invariants, and retained provenance. Provider execution
and background job processing remain to be implemented.

## Milestone Status

| ID | Milestone | Status | Evidence |
| --- | --- | --- | --- |
| M0 | Product and architecture baseline | `DONE` | ADR-0001 and ADR-0002 record the accepted baseline |
| M1 | Application foundation | `DONE` | Clean migration, seed, tests, build, HTTP, and browser evidence recorded |
| M2 | Editorial data core | `DONE` | Attributed reviewer/moderator workflow and public vertical slice verified |
| M3 | AI preparation pipeline | `IN_PROGRESS` | Persistence, schema validation, provenance, migration, and isolation tests pass |
| M4 | Public draft feedback and reviewer workspace | `PLANNED` | ADR-0003 defines safe visibility and moderated feedback; no interface exists |
| M5 | Calibration batch | `PLANNED` | Target and sample ambiguous terms are documented |
| M6 | Public dictionary | `PLANNED` | Required pages are documented |
| M7 | Search and discovery | `PLANNED` | Ranking and filters are documented |
| M8 | Community accounts and contributions | `PLANNED` | Rich contributor features extend the basic authenticated M4 feedback path |
| M9 | Launch readiness | `PLANNED` | Launch content and quality gates are documented |

## Achievements

### 2026-06-20

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

| Check | Result | Evidence |
| --- | --- | --- |
| Payload type generation | Pass | `pnpm generate:types` |
| TypeScript | Pass | `pnpm typecheck` |
| ESLint | Pass | `pnpm lint` |
| Slug normalization tests | Pass | 2 tests in `formatSlug.int.spec.ts` |
| Production build | Pass | Next.js generated all current public and Payload routes |
| HTTP smoke test | Pass | `/` and `/search?q=authentication` returned `200` |
| Hydration smoke test | Pass | Clean Chrome profile produced no hydration warning |
| Database integration | Pass | 12 self-contained integration tests pass against PostgreSQL without requiring seed data |
| Migration reproducibility | Pass | All 3 migrations applied to a disposable database and reported `Yes` |
| Visual browser QA | Pass | Desktop and mobile clean-Chrome renders inspected |

## Current Work

M3 foundation is complete. Generation jobs and review-ready AI drafts can be stored and
validated, but no provider adapter or background worker executes queued jobs yet.

## Next Actions

1. Add a provider-neutral AI adapter and deterministic test provider.
2. Implement the background research, generation, critique, validation, and routing worker.
3. Add enqueue/retry services that reuse idempotency keys and preserve partial failures.
4. Run `authentication` through the AI preparation path without publishing it.
5. Begin M4 with public-projection fields plus moderated comment and translation-suggestion persistence.

## Blockers

No active blocker is recorded.

## Risks

| Risk | Impact | Current mitigation |
| --- | --- | --- |
| AI output sounds natural but is technically wrong | Loss of trust | Independent critique and domain review routes |
| AI pipeline cost grows during batch generation | Budget pressure | Calibration batch, idempotent jobs, and cost metrics |
| Conflicting status fields permit accidental publication | Data exposure | Formal publication state machine required in M0 |
| Search leaks drafts | Unreviewed content becomes public | Public-query and authorization tests required in M2 and M7 |
| Content work outpaces reviewer capacity | Large unreviewed backlog | Batches of 100 to 200 after calibration |
| Public feedback attracts spam or abuse | Moderation load and unsafe public content | Authentication, pending-by-default submissions, rate limits, screening, and moderator controls |

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
